const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function extractTiles() {
  const img = await loadImage('sprites.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  // The maze is in the left portion, 228x248 pixels
  // Tiles are 8x8 pixels
  // Maze is 28 tiles wide x 31 tiles tall = 224x248 pixels
  const mazeWidth = 28;
  const mazeHeight = 31;
  const tileSize = 8;
  
  const tileHashes = new Map();
  const tileMap = [];
  const uniqueTiles = [];
  
  function getTileData(x, y) {
    const data = ctx.getImageData(x * tileSize, y * tileSize, tileSize, tileSize).data;
    return Array.from(data);
  }
  
  function hashTile(data) {
    return data.join(',');
  }
  
  for (let y = 0; y < mazeHeight; y++) {
    const row = [];
    for (let x = 0; x < mazeWidth; x++) {
      const data = getTileData(x, y);
      const hash = hashTile(data);
      
      if (!tileHashes.has(hash)) {
        const index = uniqueTiles.length;
        tileHashes.set(hash, index);
        uniqueTiles.push({
          index,
          pixelX: x * tileSize,
          pixelY: y * tileSize,
          firstTileX: x,
          firstTileY: y
        });
      }
      row.push(tileHashes.get(hash));
    }
    tileMap.push(row);
  }
  
  console.log(`Found ${uniqueTiles.length} unique tiles\n`);
  
  console.log('Unique tile positions in sprite sheet:');
  uniqueTiles.forEach(t => {
    console.log(`  Tile ${t.index}: pixel (${t.pixelX}, ${t.pixelY}) - first at maze position (${t.firstTileX}, ${t.firstTileY})`);
  });
  
  console.log('\nTile map (28x31):');
  console.log('const MAZE_TILE_MAP: number[][] = [');
  tileMap.forEach((row, y) => {
    const rowStr = row.map(t => t.toString().padStart(2)).join(', ');
    console.log(`  [${rowStr}],${y < mazeHeight - 1 ? '' : ''} // row ${y}`);
  });
  console.log('];');
  
  console.log('\nUnique tile definitions for atlas:');
  console.log('const MAZE_TILES: {index: number, u: number, v: number}[] = [');
  uniqueTiles.forEach(t => {
    console.log(`  { index: ${t.index}, u: ${t.pixelX}, v: ${t.pixelY} },`);
  });
  console.log('];');
}

extractTiles().catch(console.error);
