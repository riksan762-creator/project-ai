export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    try {
        // --- 1. HANDLING REQUEST POST (Kirim Transkrip) ---
        if (req.method === 'POST') {
            const { audio_url } = req.body;

            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: {
                    'Authorization': ASSEMBLY_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    audio_url: audio_url,
                    speech_models: ["universal-3-pro"], // Model paling cerdas 2026
                    language_detection: true,
                    
                    // FITUR PINTAR DIMULAI DI SINI
                    summarization: true,
                    summary_model: "informative", // Memberikan info detail, bukan cuma ringkasan pendek
                    summary_type: "bullets",      // Meminta hasil dalam bentuk poin-poin penting
                    
                    // Opsional: Jika ingin mendeteksi siapa yang bicara (buat podcast)
                    speaker_labels: true 
                })
            });

            const data = await response.json();
            return res.status(response.status).json(data);
        } 

        // --- 2. HANDLING REQUEST GET (Cek Status & Ambil Hasil) ---
        else if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: "ID Transkrip diperlukan" });

            const response = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { 'Authorization': ASSEMBLY_KEY }
            });

            const data = await response.json();

            // Jika sudah selesai, kita kembalikan data yang sudah rapi
            if (data.status === 'completed') {
                return res.status(200).json({
                    status: 'completed',
                    summary: data.summary, // Ini poin-poin pentingnya
                    text: data.text,       // Ini percakapan lengkapnya (jika butuh)
                    utterances: data.utterances, // Ini potongan percakapan per orang
                    duration: data.audio_duration
                });
            } else {
                return res.status(200).json(data);
            }
        }
    } catch (error) {
        return res.status(500).json({ error: "Gagal memproses AI: " + error.message });
    }
}
