export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    try {
        if (req.method === 'POST') {
            let { audio_url } = req.body;

            // JEMBATAN YOUTUBE DI SISI SERVER (Agar tidak Failed to Fetch)
            if (audio_url.includes('youtube.com') || audio_url.includes('youtu.be')) {
                const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: audio_url,
                        downloadMode: 'audio',
                        audioFormat: 'mp3'
                    })
                });
                const cobaltJson = await cobaltRes.json();
                if (cobaltJson.url) {
                    audio_url = cobaltJson.url; // Ganti link youtube jadi link file mp3
                }
            }

            // KIRIM KE ASSEMBLY AI
            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: { 
                    'Authorization': ASSEMBLY_KEY, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    ...req.body,
                    audio_url: audio_url // Gunakan URL yang sudah matang
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
        return res.status(500).json({ error: "Server Error: " + error.message });
    }
}
