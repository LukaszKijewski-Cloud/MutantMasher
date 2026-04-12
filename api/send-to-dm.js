export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, filename, pdfBase64 } = req.body;
  if (!pdfBase64 || !filename) return res.status(400).json({ error: 'Missing data' });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Mutant Masher <onboarding@resend.dev>',
        to: ['lukas.kijewski@gmail.com'],
        subject: `🧬 New Mutant: ${name}`,
        html: `
          <h2>A new abomination has been forged!</h2>
          <p>Your Mutant Masher has generated <strong>${name}</strong>.</p>
          <p>The FAE character sheet is attached — fill in the game stats and unleash this creature upon your players.</p>
          <br>
          <p><em>Mutant Masher — Forge abominations. Confuse your enemies. Delight your party.</em></p>
        `,
        attachments: [
          {
            filename,
            content: pdfBase64,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
