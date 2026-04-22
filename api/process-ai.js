export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    if (!ASSEMBLY_KEY) {
        return res.status(500).json({ error: "ASSEMBLY_KEY missing in Environment Variables." });
    }

    try {
        // --- LOGIKA GET: CEK STATUS ---
        if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: "ID required" });

            const response = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { 'Authorization': ASSEMBLY_KEY }
            });
            const data = await response.json();
            return res.status(200).json(data);
        }

        // --- LOGIKA POST: KIRIM TRANSKRIP ---
        if (req.method === 'POST') {
            const { audio_url } = req.body;

            if (!audio_url) return res.status(400).json({ error: "Audio URL required" });

            // Body ini sudah disesuaikan dengan aturan April 2026
            const payload = {
                audio_url: audio_url,
                speech_models: ["universal-3-pro"], // WAJIB ARRAY & MODEL TERBARU
                language_detection: true,
                punctuate: true,
                format_text: true,
                summarization: true,
                summary_model: "informative",
                summary_type: "bullets"
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

        return res.status(405).json({ error: "Method not allowed" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
