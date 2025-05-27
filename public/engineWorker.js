// Chess Engine Web Worker
// This worker handles heavy chess engine API calls off the main thread

self.onmessage = async ({ data }) => {
  const { fen, depth = 18 } = data;

  if (!fen) {
    self.postMessage({ error: 'FEN string is required' });
    return;
  }

  try {
    // Use Chess-API.com for engine analysis
    const response = await fetch('https://chess-api.com/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fen,
        depth,
        maxThinkingTime: 100 // Maximum free thinking time in ms
      })
    });

    if (response.ok) {
      const result = await response.json();

      if (result.move) {
        self.postMessage({
          success: true,
          move: result.move,
          evaluation: result.evaluation,
          depth: result.depth
        });
      } else {
        self.postMessage({
          success: false,
          error: 'No move found'
        });
      }
    } else {
      self.postMessage({
        success: false,
        error: `API error: ${response.status}`
      });
    }
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
};
