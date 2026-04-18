export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

    const { url } = req.body;

    try {
        // Kita panggil Cobalt dari Server agar tidak terkena CORS Browser
        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                videoQuality: '720',
                downloadMode: 'pro' // Mode pro agar dapet link langsung
            })
        });

        const data = await response.json();
        
        if (data.url) {
            return res.status(200).json({ url: data.url });
        } else {
            return res.status(400).json({ error: "Cobalt gagal mengambil link media." });
        }
    } catch (error) {
        return res.status(500).json({ error: "Server Error: " + error.message });
    }
}
