import React from 'react';
import parse from 'html-react-parser';
import Link from '~/components/Link';
import { Color } from '~/constants/css';
import { charLimit } from '~/constants/defaultValues';

const urlRegex =
  /(\b((https?:\/\/|ftp:\/\/|www\.)\S+\.[^()\n"' ]+((?:\([^)]*\))|[^.,;:?!"'\n)\]<* ])+)\b(?:\/)?)/giu;
const urlRegex2 =
  /((https?:\/\/|ftp:\/\/|www\.)\S+\.[^()\n"' ]+((?:\([^)]*\))|[^.,;:?!"'\n)\]<* ])+)/i;

export function addCommasToNumber(number: number) {
  if (!number) return '0';

  const parts = number.toString().split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return integerPart + decimalPart;
}

// Pre-compile the emoticon data for optimal performance
const emoticons: { [key: string]: string } = {
  ':alien:': '👽',
  ':america:': '🇺🇸',
  ':agony:': '😩',
  ':angel:': '😇',
  ':angry:': '😡',
  ':ant:': '🐜',
  ':apple:': '🍎',
  ':bulb:': '💡',
  ':cop:': '👮‍♂️',
  ':china:': '🇨🇳',
  ':bad:': '👎',
  ':ball:': '⚽',
  ':badass:': '😎',
  ':bath': '🛀',
  ':bear:': '🐻',
  ':bee:': '🐝',
  ':beer:': '🍺',
  ':beers:': '🍻',
  ':bird:': '🐦',
  ':bigsmile:': '😃',
  ':book:': '📖',
  ':boxing:': '🥊',
  ':boy:': '👦',
  ':brofist:': '👊',
  ':bullseye:': '🎯',
  ':bunny:': '🐰',
  ':burger:': '🍔',
  ':burn:': '🔥',
  ':butterfly:': '🦋',
  ':bye:': '👋',
  ':cake:': '🍰',
  ':cash:': '💰',
  ':cat:': '🐱',
  ':car:': '🚗',
  ':chess:': '♟️',
  ':chicken:': '🐔',
  ':chill:': '😎',
  ':check:': '✅',
  ':cherries:': '🍒',
  ':cherry:': '🍒',
  ':chestnut:': '🌰',
  ':chocolate:': '🍫',
  ':christmas:': '🎄',
  ':clap:': '👏',
  ':clown:': '🤡',
  ':coin:': '🪙',
  ':cold:': '🥶',
  ':colored pencil:': '🖍',
  ':computer:': '💻',
  ':confounded:': '😖',
  ':confused:': '😕',
  ':congrats:': '🎉',
  ':congratulations:': '🎊',
  ':cool:': '😎',
  ':cow:': '🐄',
  ':crayon:': '🖍',
  ':crown:': '👑',
  ':cry:': '😭',
  ':cup:': '🥤',
  ':curious:': '🤔',
  ':deer:': '🦌',
  ':degree:': '🎓',
  ':devil:': '😈',
  ':diamond:': '💎',
  ':dinosaur:': '🦖',
  ':divide:': '÷',
  ':dog:': '🐶',
  ':dolphin:': '🐬',
  ':duck:': '🦆',
  ':eggplant:': '🍆',
  ':elephant:': '🐘',
  ':electric:': '⚡',
  ':electricity:': '⚡',
  ':evil:': '😈',
  ':exactly:': '🎯',
  ':exclamation:': '❗',
  ':eye:': '👁',
  ':eyes:': '👀',
  ':eyeglasses:': '👓',
  ':face:': '🤨',
  ':facepalm:': '🤦',
  ':family:': '👪',
  ':fear:': '😱',
  ':fire:': '🔥',
  ':fish:': '🐠',
  ':flex:': '💪',
  ':flower:': '🌸',
  ':food:': '🍽',
  ':fox:': '🦊',
  ':friedchicken:': '🍗',
  ':friend:': '👫',
  ':frown:': '🙁',
  ':frowning:': '🙁',
  ':frowny:': '🙁',
  ':frog:': '🐸',
  ':ghost:': '👻',
  ':gift:': '🎁',
  ':genius:': '🧠',
  ':girl:': '👧',
  ':grape:': '🍇',
  ':grapes:': '🍇',
  ':grandpa:': '👴',
  ':grandfather:': '👴',
  ':grandma:': '👵',
  ':grandmother:': '👵',
  ':gun:': '🔫',
  ':good:': '👍',
  ':goose:': '🦢',
  ':grin:': '😁',
  ':gross:': '🤮',
  ':guitar:': '🎸',
  ':ham:': '🍖',
  ':hamburger:': '🍔',
  ':hamster:': '🐹',
  ':hammer:': '🔨',
  ':hand:': '✋',
  ':hands:': '🙌',
  ':haha:': '😄',
  ':hehe:': '😆',
  ':happy:': '😃',
  ':heart:': '❤️',
  ':hello:': '👋',
  ':help:': '🆘',
  ':helpless:': '😩',
  ':hen:': '🐔',
  ':hi:': '👋',
  ':highfive:': '🙌',
  ':hmmm:': '🤔',
  ':horror:': '😱',
  ':horse:': '🐴',
  ':house:': '🏠',
  ':hug:': '🤗',
  ':human:': '👨',
  ':hundred:': '💯',
  ':icecream:': '🍨',
  ':idea:': '💡',
  ':infinity:': '∞',
  ':japan:': '🇯🇵',
  ':joy:': '😂',
  ':key:': '🔑',
  ':korea:': '🇰🇷',
  ':kiss:': '😚',
  ':kissing:': '😗',
  ':laugh:': '🤣',
  ':light:': '💡',
  ':lightbulb:': '💡',
  ':lion:': '🦁',
  ':lock:': '🔒',
  ':lol:': '🤣',
  ':LOL:': '🤣',
  ':love:': '😍',
  ':lucky:': '🍀',
  ':mad:': '😡',
  ':magic:': '🔮',
  ':magnifying glass:': '🔍',
  ':maple leaf:': '🍁',
  ':mindblowing:': '🤯',
  ':mindblown:': '🤯',
  ':mind blown:': '🤯',
  ':money:': '💰',
  ':monkey:': '🐵',
  ':detective:': '🧐',
  ':detective hat:': '🕵️',
  ':moo:': '🐮',
  ':moon:': '🌙',
  ':moose:': '🦌',
  ':mouse:': '🐭',
  ':multiply:': '×',
  ':music:': '🎵',
  ':nerd:': '🤓',
  ':neutral:': '😐',
  ':nervous:': '😅',
  ':nice:': '👍',
  ':no:': '🙅‍♂️',
  ':old:': '👴',
  ':ocean:': '🌊',
  ':ok:': '👌',
  ':okay:': '👌',
  ':onion:': '🧅',
  ':orange:': '🍊',
  ':paint:': '🎨',
  ':paintbrush:': '🖌',
  ':palette:': '🎨',
  ':party:': '🎉',
  ':peace:': '✌️',
  ':peach:': '🍑',
  ':pear:': '🍐',
  ':pencil:': '✏️',
  ':penguin:': '🐧',
  ':pensive:': '😔',
  ':perfect:': '💯',
  ':person:': '👤',
  ':phone:': '📱',
  ':pi:': 'π',
  ':pig:': '🐷',
  ':pineapple:': '🍍',
  ':pizza:': '🍕',
  ':police:': '👮‍♂️',
  ':poo:': '💩',
  ':poop:': '💩',
  ':popcorn:': '🍿',
  ':potato:': '🥔',
  ':pray:': '🙏',
  ':present:': '🎁',
  ':puke:': '🤮',
  ':puppy:': '🐶',
  ':question:': '❓',
  ':rabbit:': '🐰',
  ':rainbow:': '🌈',
  ':reindeer:': '🦌',
  ':repeat:': '🔁',
  ':restroom:': '🚻',
  ':ribbon:': '🎀',
  ':robot:': '🤖',
  ':rocket:': '🚀',
  ':rooster:': '🐓',
  ':sad:': '😢',
  ':santa:': '🎅',
  ':savor': '😋',
  ':scared:': '😱',
  ':scholar:': '🧑‍🎓',
  ':scissors:': '✂️',
  ':scream:': '😱',
  ':shock:': '😳',
  ':shocked:': '😳',
  ':shit:': '💩',
  ':shrug:': '🤷',
  ':sick:': '🤒',
  ':skull:': '💀',
  ':sleep:': '😴',
  ':smh:': '🤦',
  ':smile:': '😊',
  ':smiley:': '😃',
  ':smirk:': '😏',
  ':snail:': '🐌',
  ':snake:': '🐍',
  ':snowman:': '⛄',
  ':sorry:': '😔',
  ':sparkle:': '✨',
  ':sparkles:': '✨',
  ':spider:': '🕷',
  ':spiderweb:': '🕸',
  ':spot on:': '🎯',
  ':squared:': '²',
  ':squid:': '🦑',
  ':squint:': '😆',
  ':squinting:': '😆',
  ':star:': '⭐',
  ':starstruck:': '🤩',
  ':strawberry:': '🍓',
  ':sun:': '☀️',
  ':sunglasses:': '😎',
  ':swan:': '🦢',
  ':sweat:': '😓',
  ':taco:': '🌮',
  ':task:': '📝',
  ':tasty:': '🤤',
  ':tea:': '🍵',
  ':tear:': '😢',
  ':tears:': '😢',
  ':teeth:': '🦷',
  ':telephone:': '☎️',
  ':telescope:': '🔭',
  ':thanks:': '🙏',
  ':thankyou:': '🙏',
  ':thank you:': '🙏',
  ':thinking:': '🤔',
  ':this:': '👆',
  ':theta:': 'θ',
  ':thumb:': '👍',
  ':thumbs:': '👍',
  ':thumbsup:': '👍',
  ':thumbs up:': '👍',
  ':thumbsdown:': '👎',
  ':thumbs down:': '👎',
  ':tiger:': '🐯',
  ':tired:': '😫',
  ':toilet:': '🚽',
  ':tomato:': '🍅',
  ':tongue:': '👅',
  ':tooth:': '🦷',
  ':tophat:': '🎩',
  ':tornado:': '🌪',
  ':tortoise:': '🐢',
  ':traffic:': '🚦',
  ':trafficlight:': '🚦',
  ':traffic light:': '🚦',
  ':train:': '🚂',
  ':trash:': '🗑',
  ':triangle:': '△',
  ':tree:': '🌳',
  ':troll:': '🤬',
  ':trophy:': '🏆',
  ':turtle:': '🐢',
  ':tv:': '📺',
  ':twin:': '👯‍♂️',
  ':twinkle:': '✨',
  ':ufc:': '🥊',
  ':ufo:': '🛸',
  ':umbrella:': '☂️',
  ':unamused:': '😒',
  ':unequal:': '≠',
  ':unhappy:': '😒',
  ':unicorn:': '🦄',
  ':up:': '👆',
  ':upsidedown:': '🙃',
  ':upside down:': '🙃',
  ':upside-down:': '🙃',
  ':usa:': '🇺🇸',
  ':vampire:': '🧛‍♂️',
  ':volcano:': '🌋',
  ':vomit:': '🤮',
  ':wait:': '⏳',
  ':waiting:': '⏳',
  ':walnut:': '🌰',
  ':warning:': '⚠️',
  ':water:': '💧',
  ':watermelon:': '🍉',
  ':wave:': '👋',
  ':weary:': '😩',
  ':wink:': '😉',
  ':wow:': '😮',
  ':wtf:': '😱',
  ':wonder:': '😮',
  ':yep:': '👌',
  ':yes:': '👍',
  ':yum:': '😋',
  ':yummy:': '😋',
  ':zap:': '⚡',
  ':zebra:': '🦓',
  ':zipped:': '🤐',
  ':zipper:': '🤐',
  ':zombie:': '🧟',
  ':zzz:': '😴',
  ':^^:': '😊'
};

// Split emoji keys into buckets to avoid iOS Safari 32KB regex limit
const emoticonBuckets = (() => {
  const buckets = Object.keys(emoticons).reduce(
    (bucketMap, key) => {
      const bucketIndex = key.charCodeAt(1) % 3; // Split into 3 buckets
      (bucketMap[bucketIndex] ??= []).push(key);
      return bucketMap;
    },
    {} as Record<number, string[]>
  );

  return Object.values(buckets)
    .map((keyArray) => {
      try {
        const pattern = `(${keyArray
          .map((key) => key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
          .join('|')})`;
        return new RegExp(pattern, 'gi');
      } catch (error) {
        console.warn('Failed to compile emoji regex bucket:', error);
        return null;
      }
    })
    .filter(Boolean) as RegExp[];
})();

export function addEmoji(string: string): string {
  // Guard against non-strings
  if (typeof string !== 'string') return '';

  // If no regex buckets compiled, return string unchanged
  if (emoticonBuckets.length === 0) {
    return string;
  }

  try {
    let result = string;
    // Apply each regex bucket sequentially
    for (const regex of emoticonBuckets) {
      if (regex) {
        result = result.replace(regex, (match) => emoticons[match] || match);
      }
    }
    return result;
  } catch (error) {
    console.warn('Error processing emojis:', error);
    return string;
  }
}

export function capitalize(string = '') {
  if (!string) return '';
  return string?.charAt(0)?.toUpperCase?.() + string?.slice(1);
}

export function containsTwinkleVideoUrl(string: string): boolean {
  const regex =
    /(^((http[s]?:\/\/(www\.)?|www\.)(twin-kle.com)\/videos\/[0-9]+))/g;
  return regex.test(string);
}

export function extractVideoIdFromTwinkleVideoUrl(
  string: string
): string | null {
  const regex =
    /(^((http[s]?:\/\/(www\.)?|www\.)(twin-kle.com)\/videos\/[0-9]+))/g;
  if (!regex.test(string)) return null;
  const urlArray = string.match(regex);
  const videoId = urlArray?.[0]?.split?.('videos/')?.[1] || null;
  return videoId;
}

// Pre-compile shortcut replacements to avoid rebuilding regexes
const shortcuts = {
  brb: 'be right back',
  gtg: 'got to go',
  tbh: 'to be honest',
  nvm: 'never mind',
  verylongword: 'pneumonoultramicroscopicsilicovolcanoconiosis'
};

const shortcutRegex = (() => {
  try {
    const pattern = `\\((${Object.keys(shortcuts).join('|')})\\)`;
    return new RegExp(pattern, 'gi');
  } catch (error) {
    console.warn('Failed to compile shortcut regex:', error);
    return null;
  }
})();

export function expandShortcut(string: string): string {
  // Guard against non-strings
  if (typeof string !== 'string') return '';

  // If regex compilation failed, return string unchanged
  if (!shortcutRegex) {
    return string;
  }

  try {
    return string.replace(
      shortcutRegex,
      (match, shortcut) =>
        shortcuts[shortcut.toLowerCase() as keyof typeof shortcuts] || match
    );
  } catch (error) {
    console.warn('Error processing shortcuts:', error);
    return string;
  }
}

export function exceedsCharLimit({
  inputType,
  contentType,
  text
}: {
  inputType?: string;
  contentType: string;
  text: string;
}): {
  style: { color: string; borderColor: string };
  message: string;
} | null {
  const targetText = text || '';
  const limit =
    contentType === 'comment' ||
    contentType === 'rewardComment' ||
    contentType === 'statusMsg'
      ? charLimit[contentType]
      : (charLimit[contentType] as { [key: string]: number })[inputType || ''];
  return targetText.length > limit
    ? {
        style: {
          color: 'red',
          borderColor: 'red'
        },
        message: `${targetText.length}/${limit} Characters`
      }
    : null;
}

export function fetchURLFromText(text: string): string {
  if (!text) return '';
  const url = text.match(urlRegex)?.[0] || '';
  const processedURL =
    (url.split('.')[0] || '').toLowerCase() + (url.split('.')[1] || '');
  if (
    processedURL &&
    !processedURL.includes('http://') &&
    !processedURL.includes('https://')
  ) {
    return 'http://' + url;
  }
  return url;
}

export function fetchedVideoCodeFromURL(url: string): string {
  let videoCode = '';
  try {
    url = decodeURIComponent(url);
  } catch {
    // ignore decode errors and use original url
  }
  if (typeof url.split('v=')[1] !== 'undefined') {
    const trimmedUrl = url?.split('v=')[1]?.split('#')[0];
    videoCode = trimmedUrl.split('&')[0];
  } else {
    const trimmedUrl = url?.split('youtu.be/')[1]?.split('#')?.[0];
    videoCode = trimmedUrl?.split('&')[0]?.split('?')?.[0];
  }
  return videoCode || '';
}

export function finalizeEmoji(string: string): string {
  // Guard against non-strings and empty strings
  if (typeof string !== 'string' || stringIsEmpty(string)) return '';

  let finalizedString = addEmoji(expandShortcut(string + ' '));
  if (finalizedString[finalizedString.length - 1] === ' ') {
    finalizedString = finalizedString.slice(0, -1);
  }
  return finalizedString || '';
}

export function formatVisitLabel(viewCount?: number | null) {
  const visits = Number.isFinite(Number(viewCount)) ? Number(viewCount) : 0;
  if (visits <= 0) return 'No visits yet';
  if (visits === 1) return '1 visit';
  return `${visits} visits`;
}

export function getFileInfoFromFileName(fileName: string): {
  extension: string;
  fileType: string;
} {
  if (typeof fileName !== 'string') return { extension: '', fileType: '' };
  const fileNameArray = fileName.split('.');
  const extension =
    fileNameArray[fileNameArray.length - 1]?.toLowerCase?.() || '';
  return { extension, fileType: getFileType(extension) };

  function getFileType(extension: string): string {
    const audioExt = ['wav', 'aif', 'mp3', 'mid', 'm4a'];
    const imageExt = [
      'jpg',
      'png',
      'jpeg',
      'bmp',
      'gif',
      'webp',
      'svg',
      'heic',
      'heif'
    ];
    const movieExt = ['wmv', 'mov', 'mp4', '3gp', 'ogg', 'm4v'];
    const compressedExt = ['zip', 'rar', 'arj', 'tar', 'gz', 'tgz'];
    const wordExt = ['docx', 'docm', 'dotx', 'dotm', 'docb'];
    if (audioExt.includes(extension)) {
      return 'audio';
    }
    if (imageExt.includes(extension)) {
      return 'image';
    }
    if (movieExt.includes(extension)) {
      return 'video';
    }
    if (compressedExt.includes(extension)) {
      return 'archive';
    }
    if (wordExt.includes(extension)) {
      return 'word';
    }
    if (extension === 'pdf') {
      return 'pdf';
    }
    return 'other';
  }
}
export function getRenderedTextForVocabQuestions(
  text: string,
  word: string,
  color: string
) {
  if (word) {
    const regex = new RegExp(word, 'gi');
    return text.replace(
      regex,
      `<b style="color:${Color[color]()}">${word}</b>`
    );
  }
  return text || '';
}

export function hashify(string: string): string {
  const stringArray = string.split(' ');
  const hashedString =
    '#' + stringArray.map((string) => capitalize(string)).join('');
  return hashedString;
}

export function isValidEmailAddress(email: string) {
  const regex =
    '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';
  const pattern = new RegExp(regex);
  return pattern.test(email);
}

export function isValidSpoiler(content = '') {
  let displayedContent = '';
  if ((content || '').startsWith('/secret ')) {
    displayedContent = content.substring(8);
  }
  if ((content || '').startsWith('/spoiler ')) {
    displayedContent = content.substring(9);
  }
  return !stringIsEmpty(displayedContent);
}

export function isValidUrl(url = '') {
  if (!url.includes('://') && !url.includes('www.')) {
    url = 'www.' + url;
  }
  return urlRegex2.test(url);
}

export function isValidYoutubeUrl(url = '') {
  if (!url.includes('://') && !url.includes('www.')) {
    url = 'www.' + url;
  }
  const trimOne = url.split('v=')[1];
  const trimTwo = url.split('youtu.be/')[1];
  return (
    urlRegex2.test(url) &&
    (typeof trimOne !== 'undefined' || typeof trimTwo !== 'undefined')
  );
}

export function isValidPassword(password: string): boolean {
  return password.length > 4 && !stringIsEmpty(password);
}

export function isValidUsername(username: string): boolean {
  const pattern = new RegExp(/^(?!.*___.*)[a-zA-Z0-9_]+$/);
  return (
    !!username &&
    username.length < 20 &&
    username.length > 2 &&
    pattern.test(username)
  );
}

export function validateUsername(username: string): {
  isValid: boolean;
  reason: string;
} {
  const pattern = new RegExp(/^(?!.*___.*)[a-zA-Z0-9_]+$/);
  if (!username) {
    return { isValid: false, reason: 'Username is empty.' };
  }
  if (username.length >= 20) {
    return { isValid: false, reason: `That's too long.` };
  }
  if (username.length <= 2) {
    return { isValid: false, reason: `That's too short.` };
  }
  if (!pattern.test(username)) {
    return {
      isValid: false,
      reason: `Contains invalid characters or three consecutive underscores.`
    };
  }
  return { isValid: true, reason: '' };
}

export function isUnicodeArt(str: string) {
  const unicodeArtCharacters = /[\u2580-\u259F\u2800-\u28FF]/;
  return unicodeArtCharacters.test(str) && str.length > 50;
}

export function isValidYoutubeChannelUrl(url = '') {
  const trim = url.split('youtube.com/')[1];
  if (!url.includes('://') && !url.includes('www.')) {
    url = 'www.' + url;
  }
  return urlRegex2.test(url) && typeof trim !== 'undefined';
}

export function limitBrs(string: string): string {
  return (string || '').replace(
    /(<br ?\/?>){11,}/gi,
    '<br><br><br><br><br><br><br><br><br><br>'
  );
}

export function processMentionLink(text: string): React.ReactNode {
  const result = parse(limitBrs(text), {
    replace: (domNode) => {
      if (
        domNode.type === 'tag' &&
        domNode.name === 'a' &&
        domNode.attribs?.class === 'mention'
      ) {
        const node = domNode.children?.[0];
        return (
          <Link to={domNode.attribs.href || ''}>{(node as any)?.data}</Link>
        );
      }
    }
  });
  return result;
}

export function processedQueryString(string: string): string {
  return string
    ? string
        .replace(/\r?\n/g, '<br>')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '<br>')
    : '';
}

export function applyTextSize(string: string): string {
  type FontSize = 'huge' | 'big' | 'small' | 'tiny';
  const wordRegex: { [K in FontSize]: RegExp } = {
    huge: /(h\[[^\s]+\]h)/gi,
    big: /(b\[[^\s]+\]b)/gi,
    small: /(s\[[^\s]+\]s)/gi,
    tiny: /(t\[[^\s]+\]t)/gi
  };
  const sentenceRegex: { [K in FontSize]: RegExp } = {
    huge: /((h\[[^\s]){1}((?!(h\[|\]h))[^\n])+([^\s]\]h){1})/gi,
    big: /((b\[[^\s]){1}((?!(b\[|\]b))[^\n])+([^\s]\]b){1})/gi,
    small: /((s\[[^\s]){1}((?!(s\[|\]s))[^\n])+([^\s]\]s){1})/gi,
    tiny: /((t\[[^\s]){1}((?!(t\[|\]t))[^\n])+([^\s]\]t){1})/gi
  };
  const fontSizes = {
    huge: '3rem',
    big: '2rem',
    small: '1rem',
    tiny: '0.5rem'
  };

  let outputString = string;

  Object.keys(wordRegex).forEach((key) => {
    outputString = outputString.replace(
      wordRegex[key as FontSize],
      (string) =>
        `<span style="font-size: ${
          fontSizes[key as FontSize]
        };">${string.substring(2, string.length - 2)}</span>`
    );
  });

  Object.keys(sentenceRegex).forEach((key) => {
    outputString = outputString.replace(
      sentenceRegex[key as FontSize],
      (string) =>
        `<span style="font-size: ${
          fontSizes[key as FontSize]
        };">${string.substring(2, string.length - 2)}</span>`
    );
  });

  return outputString;
}

export function stripTextSizeMarkers(string: string): string {
  const textSizeMarkerRegex = /([hbst])\[([^\n]*?)\]\1/gi;
  let outputString = String(string || '');
  let previousString = '';

  while (outputString !== previousString) {
    previousString = outputString;
    outputString = outputString.replace(textSizeMarkerRegex, '$2');
  }

  return outputString;
}

export function stripTextColorMarkers(string: string): string {
  // color effects use `code|text|code` (e.g. b|hi|b, lb|hi|lb, pf|hi|pf)
  const colorMarkerRegex = /(gr|lb|pf|pu|b|g|l|o|p|r|y)\|([^|\n]+?)\|\1/gi;
  let outputString = String(string || '');
  let previousString = '';

  while (outputString !== previousString) {
    previousString = outputString;
    outputString = outputString.replace(colorMarkerRegex, '$2');
  }

  return outputString;
}

// Plain-text preview of rich content: strips Twinkle text-size/color markers,
// underline, image/link markdown, and HTML, then collapses whitespace. Use for
// compact embed previews so editor markup never leaks as raw characters.
export function getPlainPreviewText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return stripTextColorMarkers(stripTextSizeMarkers(value))
    .replace(/__([^_\n]+?)__/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function applyTextEffects({ string }: { string: string }) {
  const underlineRegex =
    /([^@]|^)(((?![0-9.])__([^\s][^_\n ]+)__(?![0-9]))|(((__[^_ ]){1}((?!(__))[^\n])+([^_ ]__){1})))/gi;
  const blueRegex =
    /(((?![0-9.])b\|[^\s]+\|b(?![0-9]))|(((b\|[^\s]){1}((?!(b\||\|b))[^\n])+([^\s]\|b){1})))/gi;
  const grayRegex =
    /(((?![0-9.])gr\|[^\s]+\|gr(?![0-9]))|(((gr\|[^\s]){1}((?!(gr\||\|gr))[^\n])+([^\s]\|gr){1})))/gi;
  const greenRegex =
    /(((?![0-9.])g\|[^\s]+\|g(?![0-9]))|(((g\|[^\s]){1}((?!(g\||\|g))[^\n])+([^\s]\|g){1})))/gi;
  const limeRegex =
    /(((?![0-9.])l\|[^\s]+\|l(?![0-9]))|(((l\|[^\s]){1}((?!(l\||\|l))[^\n])+([^\s]\|l){1})))/gi;
  const logoBlueRegex =
    /(((?![0-9.])lb\|[^\s]+\|lb(?![0-9]))|(((lb\|[^\s]){1}((?!(lb\||\|lb))[^\n])+([^\s]\|lb){1})))/gi;
  const orangeRegex =
    /(((?![0-9.])o\|[^\s]+\|o(?![0-9]))|(((o\|[^\s]){1}((?!(o\||\|o))[^\n])+([^\s]\|o){1})))/gi;
  const passionFruitRegex =
    /(((?![0-9.])pf\|[^\s]+\|pf(?![0-9]))|(((pf\|[^\s]){1}((?!(pf\||\|pf))[^\n])+([^\s]\|pf){1})))/gi;
  const pinkRegex =
    /(((?![0-9.])p\|[^\s]+\|p(?![0-9]))|(((p\|[^\s]){1}((?!(p\||\|p))[^\n])+([^\s]\|p){1})))/gi;
  const purpleRegex =
    /(((?![0-9.])pu\|[^\s]+\|pu(?![0-9]))|(((pu\|[^\s]){1}((?!(pu\||\|pu))[^\n])+([^\s]\|pu){1})))/gi;
  const redRegex =
    /(((?![0-9.])r\|[^\s]+\|r(?![0-9]))|(((r\|[^\s]){1}((?!(r\||\|r))[^\n])+([^\s]\|r){1})))/gi;
  const yellowRegex =
    /(((?![0-9.])y\|[^\s]+\|y(?![0-9]))|(((y\|[^\s]){1}((?!(y\||\|y))[^\n])+([^\s]\|y){1})))/gi;

  const result = string
    .replace(/(<br>)/gi, '\n')
    .replace(
      underlineRegex,
      (match, prefix) =>
        `${prefix || ''}<u>${match.slice(
          prefix ? prefix.length + 2 : 2,
          -2
        )}</u>`
    )
    .replace(
      blueRegex,
      (string) =>
        `<span style="color: rgb(5,110,178);">${string.substring(
          2,
          string.length - 2
        )}</span>`
    )
    .replace(
      greenRegex,
      (string) =>
        `<span style="color: rgb(40,182,44);">${string.substring(
          2,
          string.length - 2
        )}</span>`
    )
    .replace(
      limeRegex,
      (string) =>
        `<span style="color: lawngreen;">${string.substring(
          2,
          string.length - 2
        )}</span>`
    )
    .replace(
      logoBlueRegex,
      (string) =>
        `<span style="color: rgb(65, 140, 235);">${string.substring(
          3,
          string.length - 3
        )}</span>`
    )
    .replace(
      orangeRegex,
      (string) =>
        `<span style="color: orange;">${string.substring(
          2,
          string.length - 2
        )}</span>`
    )
    .replace(
      passionFruitRegex,
      (string) =>
        `<span style="color: rgb(243,103,123);">${string.substring(
          3,
          string.length - 3
        )}</span>`
    )
    .replace(
      pinkRegex,
      (string) =>
        `<span style="color: rgb(255,105,180);">${string.substring(
          2,
          string.length - 2
        )}</span>`
    )
    .replace(
      purpleRegex,
      (string) =>
        `<span style="color: rgb(152,28,235);">${string.substring(
          3,
          string.length - 3
        )}</span>`
    )
    .replace(
      grayRegex,
      (string) =>
        `<span style="color: gray;">${string.substring(
          3,
          string.length - 3
        )}</span>`
    )
    .replace(
      redRegex,
      (string) =>
        `<span style="color: red;">${string.substring(
          2,
          string.length - 2
        )}</span>`
    )
    .replace(
      yellowRegex,
      (string) =>
        `<span style="color: rgb(255,210,0);">${string.substring(
          2,
          string.length - 2
        )}</span>`
    );
  return result;
}

export function processedURL(url: string): string {
  if (!url.includes('://')) {
    url = 'http://' + url;
  }
  return url;
}

export function processInternalLink(url = '') {
  const regex =
    /^(https?:\/\/(?:www\.)?|www\.)(twin-kle\.com|twinkle\.network|localhost:3000)/;
  const isInternalLink = regex.test(url);
  const replacedLink = url.replace(regex, '');
  return { isInternalLink, replacedLink };
}

export function queryStringForArray({
  array,
  originVar,
  destinationVar
}: {
  array: any[];
  originVar?: string;
  destinationVar: string;
}): string {
  return `${array
    .map((elem) => `${destinationVar}[]=${originVar ? elem[originVar] : elem}`)
    .join('&')}`;
}

export function removeLineBreaks(string: string): string {
  return string.replace(/\n/gi, ' ').replace(/ {2,}/gi, ' ');
}

export function renderFileSize(fileSize: number): string | null {
  if (fileSize > 1_000_000) {
    return `(${(fileSize / 1_000_000).toFixed(2)} MB)`;
  }
  if (fileSize > 1000) {
    return `(${(fileSize / 1000).toFixed(2)} KB)`;
  }
  return null;
}

export function renderText(text: string): string {
  return text.replace(/^\s+/, '').replace(/\s{3,}$/, '  ');
}

export function replaceFakeAtSymbol(string: string): string {
  if (stringIsEmpty(string)) return '';
  return string.replace(/＠/g, '@');
}

export function generateFileName(fileName: string): string {
  if (!fileName) return '';

  const fileInfo = getFileInfoFromFileName(fileName);
  const extension = fileInfo.extension;

  // Generate a unique identifier using timestamp + random string
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const uniqueId = `${timestamp}-${randomString}`;

  if (!extension) {
    return uniqueId;
  }

  return `${uniqueId}.${extension}`;
}

export function stringIsEmpty(string: string | null | undefined): boolean {
  const evalString = string || '';
  if (evalString && typeof evalString !== 'string') return true;
  return evalString.length === 0 || !evalString.trim();
}

export function translateMBToGB(size: number): string {
  if (size >= 1000) {
    return `${size / 1000} GB`;
  }
  return `${size} MB`;
}

export function translateMBToGBWithoutSpace(size: number): string {
  if (size >= 1000) {
    return `${size / 1000}GB`;
  }
  return `${size}MB`;
}

export function trimUrl(url: string | null | undefined) {
  const trimHttp = url?.split('//')[1] || url?.split('//')[0];
  const trimWWW = trimHttp?.split('www.')[1] || trimHttp?.split('www.')[0];
  return trimWWW;
}

export function removeAllWhiteSpaces(text = '') {
  return (text || '').replace(/\s+/g, '').trim();
}

export function trimWhiteSpaces(text = '') {
  return (text || '').trim();
}

export function truncateText({
  text = '',
  limit
}: {
  text: string;
  limit: number;
}): string {
  if (text?.length > limit) {
    return text.substring(0, limit) + '...';
  }
  return text;
}

export function truncateTopic(topic: string): string {
  // Remove quotes if enclosed in them
  if (topic.startsWith('"') && topic.endsWith('"')) {
    topic = topic.slice(1, -1);
  } else if (topic.startsWith("'") && topic.endsWith("'")) {
    topic = topic.slice(1, -1);
  }
  if (topic.endsWith('.')) {
    topic = topic.slice(0, -1);
  }
  // Truncate if over 100 characters
  if (topic.length > 100) {
    topic = topic.slice(0, 100) + '...';
  }

  return topic;
}

export function stringsAreCaseInsensitivelyEqual(
  string1: string,
  string2: string
): boolean {
  if (typeof string1 !== 'string' || typeof string2 !== 'string') {
    return false;
  }
  return string1.toLowerCase() === string2.toLowerCase();
}

export function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}
