export default async function handler(req, res) {
    const ASSEMBLY_KEY = process.env.ASSEMBLY_KEY;

    try {
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
            return res.status(200).json(data);
        } else {
            // Perbaikan pengambilan ID untuk polling
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
