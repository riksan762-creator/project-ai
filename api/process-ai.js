export default async function handler(req, res) {
    // Ambil Key dari Environment Variable Vercel
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    if (!ASSEMBLY_KEY) {
        return res.status(500).json({ error: "API Key belum terpasang di Vercel, Bos!" });
    }

    try {
        // TAHAP 1: KIRIM PERMINTAAN (POST)
        if (req.method === 'POST') {
            const response = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: { 
                    'Authorization': ASSEMBLY_KEY, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(req.body)
            });
            
            const data = await response.json();
            
            // Jika AssemblyAI menolak (Error 400/401/dll)
            if (!response.ok) {
                return res.status(response.status).json({ 
                    error: data.error || "Gagal kirim ke AssemblyAI" 
                });
            }
            
            return res.status(200).json(data);
        } 
        
        // TAHAP 2: CEK STATUS (GET)
        else if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: "ID Transkrip wajib diisi!" });

            const response = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { 'Authorization': ASSEMBLY_KEY }
            });
            
            const data = await response.json();
            return res.status(200).json(data);
        }
    } catch (error) {
        // Jika server Vercel yang bermasalah
        return res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
}
