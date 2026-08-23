export default async function handler(req, res) {
  const apiKey = process.env.SBMIND_API_KEY;
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

    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    const sbmindEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are a highly strict AI security and fraud prevention assistant. The user is trying to verify they own a physical copy of the "Adult Teacher 2026" AG Sunday School manual to unlock digital access.

I am providing you with two images:
1. The front cover of the manual.
2. A photo of the open manual showing BOTH the inside cover and Page 1/Page 2.

Your task is to verify the following STRICT RULES:
1. Cover Verification: The first image MUST be the official front cover of the "Adult Teacher 2026" AG Sunday School manual.
2. Full Open Spread Required: The second image MUST show the full, wide open spread of the book (typically the inside cover and the first title/copyright page). Do NOT accept a zoomed-in photo of just a name. The full pages must be visible to prove it's the actual manual.
3. Content Matching: Inspect the text and layout of the open pages in the second image. It MUST look like the inside of the authentic AG Adult manual (e.g., copyright info, title page). If it looks like a generic notebook or a different book with a printed cover, reject it.
4. Strict Name Match: The handwritten name on the inside page MUST exactly match ""${userName}"" (case-insensitive, fuzzy match is okay if handwriting is messy, but it must be clearly the same name).
5. Ink Required (No Pencil): The name MUST be written in dark ink (pen/marker). Pencil marks (ash/gray smudgy lines) are strictly forbidden and must be rejected.
6. No Cancellations (Fraud Prevention): There must NOT be any scratched out, scribbled over, erased, or crossed out names anywhere on the page. If a name has been written over, or if multiple different names are present, reject it immediately.
7. Physical Authenticity: Reject if it looks like a sticky note, a piece of paper placed over the book, digital text photoshopped on, or a picture taken of a screen.

If ALL rules are satisfied, return {"verified": true, "reason": "Verification successful."}
If ANY rule is violated, return {"verified": false, "reason": "Specific reason for rejection."}

You must return ONLY valid JSON in this exact structure, with no markdown formatting or backticks around it.`;

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

    const response = await fetch(sbmindEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("SBMIND COGNITIVE ENGINE API Error:", err);
        return res.status(500).json({ error: 'Failed to verify with SBMIND COGNITIVE ENGINE' });
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




