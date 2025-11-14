import axios from "axios";

export default async function handler(req, res) {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({
            status: false,
            message: "url wajib"
        });
    }

    try {
        // Hapus parameter sampah (?si=dst)
        const cleanUrl = url.split("?")[0];

        // Gunakan proxy scrape YouTube gratis & stabil
        const apiUrl = `https://pytube-proxy.onrender.com/api/info?url=${cleanUrl}`;

        const result = await axios.get(apiUrl, {
            timeout: 15000 // 15 detik
        });

        return res.json({
            status: true,
            data: result.data
        });

    } catch (error) {
        console.log("YT ERROR:", error.message);

        return res.json({
            status: false,
            message: "gagal_mengambil_dari_proxy"
        });
    }
}
