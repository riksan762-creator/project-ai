export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    if (!ASSEMBLY_KEY) {
        return res.status(500).json({ error: "API Key AssemblyAI belum ada di environment vercel." });
    }

    try {
        if (req.method === 'POST') {
            const { audio_url } = req.body;

            if (!audio_url) {
                return res.status(400).json({ error: "URL Audio tidak ditemukan." });
            }

            // KONFIGURASI PALING PINTAR & TERBARU 2026
            const payload = {
                audio_url: audio_url,
                // Gunakan universal-3-pro (Terbaik & Akurat untuk Bahasa Indonesia/Inggris)
                speech_models: ["universal-3-pro"], 
                language_detection: true, // Otomatis deteksi bahasa
                punctuate: true,          // Otomatis tanda baca
                format_text: true         // Otomatis rapihin teks
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
                // Jika masih ada error dari AssemblyAI, lempar ke sini
                return res.status(400).json({ error: "Kesalahan API: " + data.error });
            }

            return res.status(200).json(data);
        } 
        
        else if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: "ID Transkrip wajib ada." });

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
