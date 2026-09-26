// The play-area reads a signed-out visitor may make, through the API's public
// twin (twinkle-api routes/minecraft.ts PUBLIC_MINECRAFT_READS): guests can play
// games built on play areas. Every other Twinkle.minecraft call needs sign-in.
const PUBLIC_MINECRAFT_READS = ['levels', 'level', 'level/chunks'];

export function isPublicMinecraftRead({
  access,
  route,
  guest
}: {
  access: string;
  route: string;
  guest: boolean;
}) {
  return guest && access === 'read' && PUBLIC_MINECRAFT_READS.includes(route);
}
