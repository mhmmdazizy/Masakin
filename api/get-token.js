const midtransClient = require('midtrans-client');

module.exports = async function(req, res) {
    // Cuma terima jalur POST
    if (req.method !== 'POST') return res.status(405).json({ message: 'Jalur dilarang' });

    const { uid, name, email } = req.body;

    // Inisialisasi Midtrans Snap
    let snap = new midtransClient.Snap({
        isProduction: true, 
        serverKey: process.env.MIDTRANS_SERVER_KEY
    });

    const orderId = `PREMIUM-${uid}-${Date.now()}`;

    let parameter = {
        "transaction_details": {
            "order_id": orderId,
            "gross_amount": 5000
        },
        "customer_details": {
            "first_name": name,
            "email": email
        },
        "custom_field1": uid 
    };

    try {
        const transaction = await snap.createTransaction(parameter);
        res.status(200).json({ token: transaction.token });
    } catch (error) {
        console.error("Gagal buat token:", error);
        res.status(500).json({ error: 'Gagal membuat token pembayaran' });
    }
};
