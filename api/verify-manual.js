export default async function handler(req, res) {
  // Setup CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*') // Allow all origins for the mobile app
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { coverImageBase64, insideImageBase64, userName } = req.body;

    if (!coverImageBase64 || !insideImageBase64 || !userName) {
      return res.status(400).json({ error: 'Missing required fields. Provide coverImageBase64, insideImageBase64, and userName.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

    const prompt = `
You are a strict AI verification assistant. The user is trying to verify they own a physical copy of the "Adult Teacher 2026" AG Sunday School manual to unlock digital access.

I am providing you with two images:
1. The front cover of the manual.
2. The inside cover with the user's name handwritten on it.

Your task is to verify the following STRICT RULES:
1. Cover Verification: The first image MUST be the front cover of the "Adult Teacher 2026" AG Sunday School manual.
2. Inside Page Verification: The second image MUST be a photo of an inside page of the manual.
3. Exact Name Match: The name handwritten on the inside page MUST exactly match "${userName}" (case-insensitive, fuzzy match is okay if handwriting is messy, but it must be clearly the same name).
4. Ink Required (No Pencil): The name MUST be written in dark ink (pen/marker). Pencil marks (ash/gray smudgy lines) are strictly forbidden and must be rejected.
5. No Cancellations: There must NOT be any scratched out, scribbled over, or crossed out names on the page.
6. Fraud Detection: The handwritten name must be written directly on the page. Reject if it looks like a sticky note, a piece of paper placed over the book, or digital text photoshopped on.

If ALL rules are satisfied, return {"verified": true, "reason": "Verification successful."}.
If ANY rule is violated, return {"verified": false, "reason": "Specific reason for rejection."}.

You must return ONLY valid JSON in this exact structure, with no markdown formatting or backticks around it.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: coverImageBase64,
              },
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: insideImageBase64,
              },
            }
          ]
        }
      ]
    };

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Gemini API Error:", err);
        return res.status(500).json({ error: 'Failed to verify with Gemini AI' });
    }

    const data = await response.json();
    let textResult = data.candidates[0].content.parts[0].text.trim();
    
    // Clean up potential markdown formatting
    if (textResult.startsWith('```json')) {
      textResult = textResult.substring(7);
    }
    if (textResult.startsWith('```')) {
      textResult = textResult.substring(3);
    }
    if (textResult.endsWith('```')) {
      textResult = textResult.slice(0, -3);
    }

    const resultJson = JSON.parse(textResult.trim());
    return res.status(200).json(resultJson);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
