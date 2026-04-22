export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    if (!ASSEMBLY_KEY) {
        return res.status(500).json({ error: "ASSEMBLY_KEY is missing" });
    }

    try {
        if (req.method === 'POST') {
            const { audio_url } = req.body;

            if (!audio_url) {
                return res.status(400).json({ error: "Audio URL required" });
            }

            // PERUBAHAN FINAL:
            // Gunakan 'universal-1' atau 'universal-2' dalam format list [ ]
            const payload = {
                audio_url: audio_url,
                speech_models: ["universal-1"], 
                language_detection: true,
                punctuate: true,
                format_text: true
            };

            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: { 
                    'Authorization': ASSEMBLY_KEY, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            
            if (data.error) {
                return res.status(400).json({ error: data.error });
            }

            return res.status(200).json(data);
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
