export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    // Proteksi: Pastikan Key ada
    if (!ASSEMBLY_KEY) {
        return res.status(500).json({ error: "ASSEMBLY_KEY belum dipasang di Environment Variables Vercel." });
    }

    try {
        if (req.method === 'POST') {
            const { audio_url, ...rest } = req.body;

            if (!audio_url) {
                return res.status(400).json({ error: "Audio URL wajib ada, Bos!" });
            }

            // --- LOGIKA PINTAR: NORMALISASI PARAMETER ---
            // Kita bungkus data agar sesuai dengan standar terbaru AssemblyAI 2026
            const payload = {
                audio_url: audio_url,
                // Kita pakai 'speech_model' (singular) sebagai fallback aman
                speech_model: rest.speech_model || (rest.speech_models ? rest.speech_models[0] : "nano"),
                language_detection: true, // Otomatis deteksi bahasa (Indo/Inggris)
                punctuate: true,          // Otomatis kasih titik & koma
                format_text: true,        // Otomatis rapihin huruf kapital
                dual_channel: false       // Ubah ke true jika audio punya 2 jalur mic berbeda
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
            return res.status(response.status).json(data);
        } 
        
        else if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: "ID Transkrip tidak ditemukan di URL." });

            const response = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { 'Authorization': ASSEMBLY_KEY }
            });
            
            const data = await response.json();

            // Logika Pintar: Tambahkan info progress sederhana
            if (data.status === 'processing') {
                data.progress_message = "AI sedang mendengarkan, mohon tunggu...";
            }

            return res.status(200).json(data);
        }

        return res.status(405).json({ error: "Hanya menerima POST dan GET, Bos." });

    } catch (error) {
        console.error("DEBUG ERROR RIKSAN:", error.message);
        return res.status(500).json({ error: "Server lagi pusing: " + error.message });
    }
}
