// File ini berjalan di server Vercel, bukan di browser
export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY; // Diambil aman dari Vercel Env

    if (req.method === 'POST') {
        // Tahap 1: Kirim Transkrip
        const response = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: { 'Authorization': ASSEMBLY_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        return res.status(200).json(data);
    } else {
        // Tahap 2: Cek Status (Polling)
        const { id } = req.query;
        const response = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
            headers: { 'Authorization': ASSEMBLY_KEY }
        });
        const data = await response.json();
        return res.status(200).json(data);
    }
}
