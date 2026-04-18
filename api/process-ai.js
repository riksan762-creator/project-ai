export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    try {
        if (req.method === 'POST') {
            let { audio_url } = req.body;

            // Jika link YouTube/IG, kita convert ke link file mentah dulu via Cobalt
            if (audio_url.includes('youtube') || audio_url.includes('youtu.be') || audio_url.includes('instagram')) {
                const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: audio_url, downloadMode: 'audio' }) // Audio saja agar cepat
                });
                const cobaltJson = await cobaltRes.json();
                if (cobaltJson.url) audio_url = cobaltJson.url;
            }

            // Kirim ke AssemblyAI
            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: { 'Authorization': ASSEMBLY_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audio_url: audio_url,
                    speech_models: ["universal-3-pro"],
                    language_detection: true,
                    summarization: true,
                    summary_model: "informative",
                    summary_type: "bullets"
                })
            });

            const data = await response.json();
            return res.status(response.status).json(data);
        } 
        
        else if (req.method === 'GET') {
            const { id } = req.query;
            const response = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { 'Authorization': ASSEMBLY_KEY }
            });
            const data = await response.json();
            return res.status(200).json(data);
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
