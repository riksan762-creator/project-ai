export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    try {
        if (req.method === 'POST') {
            let { audio_url } = req.body;

            // STEP 1: LOGIKA EKSTRAKSI YANG LEBIH KUAT
            if (audio_url.includes('youtube.com') || audio_url.includes('youtu.be') || audio_url.includes('instagram.com')) {
                
                // Coba pakai Cobalt dengan Header lengkap agar tidak dianggap Bot
                try {
                    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
                        method: 'POST',
                        headers: { 
                            'Accept': 'application/json', 
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                        },
                        body: JSON.stringify({ 
                            url: audio_url, 
                            downloadMode: 'audio', 
                            audioFormat: 'mp3',
                            youtubeVideoCodec: 'h264' 
                        })
                    });
                    
                    const cobaltJson = await cobaltRes.json();
                    
                    if (cobaltJson.url) {
                        audio_url = cobaltJson.url;
                    } else {
                        // Jika Cobalt Gagal, lempar error spesifik
                        return res.status(400).json({ 
                            error: "YouTube memblokir koneksi. Gunakan link video lain atau coba beberapa saat lagi." 
                        });
                    }
                } catch (err) {
                    return res.status(500).json({ error: "Downloader Down. Coba ganti video TikTok saja sementara." });
                }
            }

            // STEP 2: KIRIM KE ASSEMBLY AI (Kunci di model 'best')
            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: { 
                    'Authorization': ASSEMBLY_KEY, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    audio_url: audio_url,
                    speech_model: "best", // Wajib 'best' untuk fitur summary
                    language_detection: true,
                    summarization: true,
                    summary_model: "informative",
                    summary_type: "bullets"
                })
            });

            const data = await response.json();
            
            // Cek jika AssemblyAI menolak URL-nya
            if (data.error) {
                return res.status(400).json({ error: "AI tidak bisa mengakses file: " + data.error });
            }

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
        return res.status(500).json({ error: "Riksan AI System Error: " + error.message });
    }
}
