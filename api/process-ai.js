export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    try {
        if (req.method === 'POST') {
            let { audio_url } = req.body;

            // STEP 1: Jembatan Cobalt (Convert Link YouTube/IG jadi File Audio Murni)
            if (audio_url.includes('youtube.com') || audio_url.includes('youtu.be') || audio_url.includes('instagram.com')) {
                const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        url: audio_url, 
                        downloadMode: 'audio', // Ambil suara saja agar proses AI super cepat
                        audioFormat: 'mp3' 
                    })
                });
                const cobaltJson = await cobaltRes.json();
                
                if (cobaltJson.url) {
                    audio_url = cobaltJson.url; // Sekarang isinya link .mp3, bukan link YouTube lagi
                } else {
                    return res.status(400).json({ error: "Gagal ekstrak audio YouTube. Coba lagi." });
                }
            }

            // STEP 2: Kirim ke AssemblyAI dengan Model yang Kompatibel
            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: { 
                    'Authorization': ASSEMBLY_KEY, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    audio_url: audio_url,
                    // PENTING: Gunakan model 'best' agar fitur Summarization jalan
                    speech_model: "best", 
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
        return res.status(500).json({ error: "Riksan AI Error: " + error.message });
    }
}
