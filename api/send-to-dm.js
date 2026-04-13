export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, filename, pdfBase64, parts, imageBase64, imageType } = req.body;
  if (!pdfBase64 || !filename) return res.status(400).json({ error: 'Missing data' });

  // Build parts table rows
  const partLabels = { head: 'Head', arms: 'Arms', torso: 'Torso', legs: 'Legs' };
  const partsRows = parts ? Object.entries(partLabels).map(([key, label]) => {
    const p = parts[key];
    if (!p) return '';
    const category = p.category === 'Custom' ? 'Custom override' : p.category;
    return `<tr>
      <td style="padding:6px 12px;font-weight:bold;color:#8b4513;text-transform:uppercase;font-size:11px;letter-spacing:1px;">${label}</td>
      <td style="padding:6px 12px;font-size:14px;">${p.name}</td>
      <td style="padding:6px 12px;font-size:12px;color:#888;">${category}</td>
    </tr>`;
  }).join('') : '';

  // Image block for email body
  const imageBlock = imageBase64 ? `
    <div style="margin:24px 0;text-align:center;">
      <img src="cid:mutant-image" alt="${name}" style="max-width:320px;border-radius:12px;border:2px solid #ddd;" />
    </div>` : '';

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1a0a2e,#2d1b4e);padding:28px;text-align:center;">
        <h1 style="color:#ffd700;margin:0;font-size:28px;letter-spacing:2px;">⚔ MUTANT MASHER ⚔</h1>
        <p style="color:#9b8a6a;margin:8px 0 0;font-style:italic;">A new abomination has been forged</p>
      </div>

      <div style="padding:28px;">
        <h2 style="color:#8b1a1a;font-size:22px;margin:0 0 20px;">${name}</h2>

        ${imageBlock}

        <h3 style="color:#555;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Body Parts</h3>
        <table style="width:100%;border-collapse:collapse;background:#f9f6f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <thead>
            <tr style="background:#2d1b4e;">
              <th style="padding:8px 12px;color:#ffd700;text-align:left;font-size:11px;letter-spacing:1px;">PART</th>
              <th style="padding:8px 12px;color:#ffd700;text-align:left;font-size:11px;letter-spacing:1px;">MONSTER</th>
              <th style="padding:8px 12px;color:#ffd700;text-align:left;font-size:11px;letter-spacing:1px;">CATEGORY</th>
            </tr>
          </thead>
          <tbody>${partsRows}</tbody>
        </table>

        <p style="color:#555;font-size:13px;line-height:1.6;">
          The FAE character sheet is attached as a PDF — fill in the game stats and unleash this creature upon your players.
        </p>
      </div>

      <div style="background:#f0ebe0;padding:16px;text-align:center;border-top:1px solid #ddd;">
        <p style="color:#9b8a6a;font-size:11px;font-style:italic;margin:0;">
          Mutant Masher &bull; Forge abominations. Confuse your enemies. Delight your party.
        </p>
      </div>
    </div>
  `;

  try {
    const attachments = [{ filename, content: pdfBase64 }];
    if (imageBase64) {
      attachments.push({
        filename: `mutant.${imageType || 'jpeg'}`,
        content: imageBase64,
        content_id: 'mutant-image',
        inline: true,
      });
    }

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
        html,
        attachments,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
