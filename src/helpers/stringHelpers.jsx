import parse from 'html-react-parser';
import Link from '~/components/Link';
import { charLimit } from '~/constants/defaultValues';

const urlRegex =
  /\b((https?:\/\/|ftp:\/\/|www\.)\S+\.[^()\n ]+((?:\([^)]*\))|[^.,;:?!"'\n\)\]<* ])+)\b/giu;
const urlRegex2 =
  /((https?:\/\/|ftp:\/\/|www\.)\S+\.[^()\n ]+((?:\([^)]*\))|[^.,;:?!"'\n\)\]<* ])+)/i;

export function addCommasToNumber(number) {
  const numArray = `${number}`.split('');
  let result = '';
  numArray.reverse();
  for (let i = 0; i < numArray.length; i++) {
    if (i % 3 === 0 && i !== 0) {
      result = numArray[i] + ',' + result;
    } else {
      result = numArray[i] + result;
    }
  }
  return result;
}

export function addEmoji(string) {
  const emoticons = {
    ':alien:': '👽',
    ':america:': '🇺🇸',
    ':agony:': '😩',
    ':angel:': '😇',
    ':angry:': '😡',
    ':ant:': '🐜',
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
    ':book:': '📖',
    ':brofist:': '👊',
    ':bunny:': '🐰',
    ':burger:': '🍔',
    ':butterfly:': '🦋',
    ':bye:': '👋',
    ':cake:': '🍰',
    ':cash:': '💰',
    ':cat:': '🐱',
    ':chess:': '♟',
    ':chicken:': '🐔',
    ':chill:': '😎',
    ':cherries:': '🍒',
    ':cherry:': '🍒',
    ':chocolate:': '🍫',
    ':christmas:': '🎄',
    ':clap:': '👏',
    ':clown:': '🤡',
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
    ':cry:': '😭',
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
    ':evil:': '😈',
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
    ':frog:': '🐸',
    ':ghost:': '👻',
    ':gift:': '🎁',
    ':good:': '👍',
    ':goose:': '🦢',
    ':grapes:': '🍇',
    ':grin:': '😁',
    ':gross:': '🤮',
    ':guitar:': '🎸',
    ':hamburger:': '🍔',
    ':hamster:': '🐹',
    ':hammer:': '🔨',
    ':hand:': '✋',
    ':happy:': '😃',
    ':heart:': '❤️',
    ':hello:': '👋',
    ':help:': '🆘',
    ':helpless:': '😩',
    ':hen:': '🐔',
    ':hi:': '👋',
    ':highfive:': '🖐',
    ':hmmm:': '🤔',
    ':horror:': '😱',
    ':horse:': '🐴',
    ':house:': '🏠',
    ':hug:': '🤗',
    ':hundred:': '💯',
    ':icecream:': '🍨',
    ':idea:': '💡',
    ':infinity:': '∞',
    ':japan:': '🇯🇵',
    ':joy:': '😂',
    ':key:': '🔑',
    ':korea:': '🇰🇷',
    ':kiss:': '💋',
    ':kissing:': '😗',
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
    ':monocle:': '🧐',
    ':moo:': '🐮',
    ':moon:': '🌙',
    ':moose:': '🦌',
    ':mouse:': '🐭',
    ':multiply:': '×',
    ':music:': '🎵',
    ':nerd:': '🤓',
    ':neutral:': '😐',
    ':nice:': '👍',
    ':no:': '🙅‍♂️',
    ':ok:': '👌',
    ':okay:': '👌',
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
    ':poo:': '💩',
    ':poop:': '💩',
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
    ':scissors:': '✂️',
    ':scream:': '😱',
    ':shock:': '😱',
    ':shocked:': '😱',
    ':shit:': '💩',
    ':shrug:': '🤷',
    ':sick:': '🤒',
    ':skull:': '💀',
    ':sleep:': '😴',
    ':smh:': '🤦',
    ':smile:': '😄',
    ':smiley:': '😃',
    ':smirk:': '😏',
    ':snail:': '🐌',
    ':snake:': '🐍',
    ':snowman:': '⛄',
    ':spider:': '🕷',
    ':spiderweb:': '🕸',
    ':squared:': '²',
    ':squid:': '🦑',
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
    ':warning:': '⚠️',
    ':water:': '💧',
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

  const emoticonRegex = new RegExp(
    `(${Object.keys(emoticons)
      .map((key) => key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
      .join('|')})`,
    'gi'
  );

  return string.replace(emoticonRegex, (match) => emoticons[match] || match);
}

export function capitalize(string = '') {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function containsTwinkleVideoUrl(string) {
  const regex =
    /(^((http[s]?:\/\/(www\.)?|www\.)(twin-kle.com)\/videos\/[0-9]+))/g;
  return regex.test(string);
}

export function extractVideoIdFromTwinkleVideoUrl(string) {
  const regex =
    /(^((http[s]?:\/\/(www\.)?|www\.)(twin-kle.com)\/videos\/[0-9]+))/g;
  if (!regex.test(string)) return null;
  const urlArray = string.match(regex);
  const videoId = urlArray?.[0]?.split?.('videos/')?.[1];
  return videoId;
}

export function expandShortcut(string) {
  return string
    .replace(/(\(brb\))/gi, 'be right back')
    .replace(/(\(gtg\))/gi, 'got to go')
    .replace(/(\(tbh\))/gi, 'to be honest')
    .replace(/(\(nvm\))/gi, 'never mind')
    .replace(
      /(\(verylongword\))/gi,
      'pneumonoultramicroscopicsilicovolcanoconiosis'
    );
}

export function exceedsCharLimit({ inputType, contentType, text }) {
  const targetText = text || '';
  const limit =
    contentType === 'comment' ||
    contentType === 'rewardComment' ||
    contentType === 'statusMsg'
      ? charLimit[contentType]
      : charLimit[contentType][inputType];
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

export function fetchURLFromText(text) {
  if (!text) return '';
  let url = text.match(urlRegex)?.[0] || '';
  const processedURL =
    (url.split('.')[0] || '').toLowerCase() + (url.split('.')[1] || '');
  if (
    processedURL &&
    !processedURL.includes('http://') &&
    !processedURL.includes('https://')
  ) {
    url = 'http://' + url;
  }
  return url;
}

export function fetchedVideoCodeFromURL(url) {
  let videoCode = '';
  if (typeof url.split('v=')[1] !== 'undefined') {
    let trimmedUrl = url?.split('v=')[1]?.split('#')[0];
    videoCode = trimmedUrl.split('&')[0];
  } else {
    let trimmedUrl = url?.split('youtu.be/')[1]?.split('#')?.[0];
    videoCode = trimmedUrl?.split('&')[0]?.split('?')?.[0];
  }
  return videoCode || '';
}

export function finalizeEmoji(string) {
  if (stringIsEmpty(string)) return '';
  let finalizedString = addEmoji(expandShortcut(string + ' '));
  if (finalizedString[finalizedString.length - 1] === ' ') {
    finalizedString = finalizedString.slice(0, -1);
  }
  return finalizedString || '';
}

export function getFileInfoFromFileName(fileName) {
  if (typeof fileName !== 'string') return '';
  const fileNameArray = fileName.split('.');
  const extension =
    fileNameArray[fileNameArray.length - 1]?.toLowerCase?.() || '';
  return { extension, fileType: getFileType(extension) };

  function getFileType(extension) {
    const audioExt = ['wav', 'aif', 'mp3', 'mid', 'm4a'];
    const imageExt = ['jpg', 'png', 'jpeg', 'bmp', 'gif', 'webp'];
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

export function hashify(string) {
  const stringArray = string.split(' ');
  const hashedString =
    '#' + stringArray.map((string) => capitalize(string)).join('');
  return hashedString;
}

export function isValidEmail(email = '') {
  const regex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}/g;
  return regex.test(email);
}

export function isValidSpoiler(content = '') {
  let displayedContent = '';
  if (content.startsWith('/secret ')) {
    displayedContent = content.substring(8);
  }
  if (content.startsWith('/spoiler ')) {
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
  let trimOne = url.split('v=')[1];
  let trimTwo = url.split('youtu.be/')[1];
  return (
    urlRegex2.test(url) &&
    (typeof trimOne !== 'undefined' || typeof trimTwo !== 'undefined')
  );
}

export function isValidPassword(password) {
  return password.length > 4 && !stringIsEmpty(password);
}

export function isValidUsername(username) {
  const pattern = new RegExp(/^(?!.*___.*)[a-zA-Z0-9_]+$/);
  return (
    !!username &&
    username.length < 20 &&
    username.length > 2 &&
    pattern.test(username)
  );
}

export function isValidYoutubeChannelUrl(url = '') {
  const trim = url.split('youtube.com/')[1];
  if (!url.includes('://') && !url.includes('www.')) {
    url = 'www.' + url;
  }
  return urlRegex2.test(url) && typeof trim !== 'undefined';
}

export function limitBrs(string) {
  return (string || '').replace(
    /(<br ?\/?>){11,}/gi,
    '<br><br><br><br><br><br><br><br><br><br>'
  );
}

export function processMentionLink(text) {
  const result = parse(limitBrs(text), {
    replace: (domNode) => {
      if (domNode.name === 'a' && domNode.attribs.class === 'mention') {
        const node = domNode.children[0];
        return <Link to={domNode.attribs.href}>{node?.data}</Link>;
      }
    }
  });
  return result;
}

export function processedQueryString(string) {
  return string
    ? string
        .replace(/\r?\n/g, '<br>')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '<br>')
    : null;
}

export function processedStringWithURL(string) {
  if (typeof string !== 'string') return string || null;
  const maxChar = 100;
  const trimmedString = (string) =>
    string.length > maxChar ? `${string.substring(0, maxChar)}...` : string;
  let tempString = applyTextSize(
    string.replace(/&/g, '&amp').replace(/</g, '&lt').replace(/>/g, '&gt')
  )
    .replace(urlRegex, `<a href=\"$1\" target=\"_blank\">$1</a>`)
    .replace(/\r?\n/g, '<br>');
  let newString = '';
  while (tempString.length > 0) {
    const hrefPos = tempString.indexOf('href="');
    if (hrefPos === -1) {
      const headPos = tempString.indexOf('target="_blank">');
      const tailPos = tempString.indexOf('</a>');
      if (headPos !== -1) {
        const wrapperHead = tempString
          .substring(0, headPos + 16)
          .replace(/&amp/g, '&')
          .replace(/&lt/g, '<')
          .replace(/&gt/g, '>');
        const url = tempString.substring(headPos + 16, tailPos);
        const wrapperTail = tempString.substring(tailPos, tempString.length);
        newString += `${wrapperHead}${trimmedString(url)}${wrapperTail}`;
      } else {
        newString += tempString;
      }
      break;
    }
    newString += tempString.substring(0, hrefPos + 6);
    tempString = tempString.substring(hrefPos + 6, tempString.length);
    if (tempString.indexOf('://') > 8 || !tempString.includes('://')) {
      newString += 'http://';
    }
  }
  const splitNewString = newString.split('<a href');
  const splitNewStringWithTextEffects = splitNewString.map((part) => {
    const splitPart = part.split('</a>');
    if (splitPart.length === 1) {
      return applyTextEffects({
        string: splitPart[0],
        isFinalProcessing: false,
        hasMention: !part.includes('</a>')
      });
    }
    return [splitPart[0], applyTextEffects({ string: splitPart[1] })].join(
      '</a>'
    );
  });
  return applyTextEffects({
    string: splitNewStringWithTextEffects.join('<a href'),
    isFinalProcessing: true,
    hasMention: false
  });

  function applyTextSize(string) {
    const wordRegex = {
      huge: /(h\[[^\s]+\]h)/gi,
      big: /(b\[[^\s]+\]b)/gi,
      small: /(s\[[^\s]+\]s)/gi,
      tiny: /(t\[[^\s]+\]t)/gi
    };
    const sentenceRegex = {
      huge: /((h\[[^\s]){1}((?!(h\[|\]h))[^\n])+([^\s]\]h){1})/gi,
      big: /((b\[[^\s]){1}((?!(b\[|\]b))[^\n])+([^\s]\]b){1})/gi,
      small: /((s\[[^\s]){1}((?!(s\[|\]s))[^\n])+([^\s]\]s){1})/gi,
      tiny: /((t\[[^\s]){1}((?!(t\[|\]t))[^\n])+([^\s]\]t){1})/gi
    };
    const fontSizes = {
      huge: '1.9em',
      big: '1.4em',
      small: '0.7em',
      tiny: '0.5em'
    };

    let outputString = string;

    Object.keys(wordRegex).forEach((key) => {
      outputString = outputString.replace(
        wordRegex[key],
        (string) =>
          `<span style="font-size: ${fontSizes[key]};">${string.substring(
            2,
            string.length - 2
          )}</span>`
      );
    });

    Object.keys(sentenceRegex).forEach((key) => {
      outputString = outputString.replace(
        sentenceRegex[key],
        (string) =>
          `<span style="font-size: ${fontSizes[key]};">${string.substring(
            2,
            string.length - 2
          )}</span>`
      );
    });

    return outputString;
  }
}

export function applyTextEffects({
  string,
  isFinalProcessing,
  hasMention = true
}) {
  const italicRegex =
    /(((?![0-9\.])\*\*[^\s*]+\*\*(?![0-9]))|(((\*\*[^\s]){1}((?!(\*\*))[^\n])+([^\s]\*\*){1})(?![0-9\.])))/gi;
  const boldRegex =
    /(((?![0-9\.])\*[^\s*]+\*(?![0-9]))|(((\*[^\s]){1}((?!(\*))[^\n])+([^\s]\*){1})(?![0-9\.])))/gi;
  const underlineRegex =
    /(?<=^|(?<!_{2}))(((?![0-9\.])__[^\n_]+__(?![0-9]))|(((__[^_]){1}((?!(__))[^\n])+([^_]\__){1})(?![0-9\.])))(?=$|(?!_{2}))/gi;
  const lineThroughRegex =
    /(((?![0-9\.])--[^\n-]+--(?![0-9]))|(((--[^-]){1}((?!(--))[^\n])+([^-\-]\--){1})(?![0-9\.])))/gi;
  const blueRegex =
    /(((?![0-9\.])b\|[^\s]+\|b(?![0-9]))|(((b\|[^\s]){1}((?!(b\||\|b))[^\n])+([^\s]\|b){1})(?![0-9\.])))/gi;
  const grayRegex =
    /(((?![0-9\.])gr\|[^\s]+\|gr(?![0-9]))|(((gr\|[^\s]){1}((?!(gr\||\|gr))[^\n])+([^\s]\|gr){1})(?![0-9\.])))/gi;
  const greenRegex =
    /(((?![0-9\.])g\|[^\s]+\|g(?![0-9]))|(((g\|[^\s]){1}((?!(g\||\|g))[^\n])+([^\s]\|g){1})(?![0-9\.])))/gi;
  const limeRegex =
    /(((?![0-9\.])l\|[^\s]+\|l(?![0-9]))|(((l\|[^\s]){1}((?!(l\||\|l))[^\n])+([^\s]\|l){1})(?![0-9\.])))/gi;
  const logoBlueRegex =
    /(((?![0-9\.])lb\|[^\s]+\|lb(?![0-9]))|(((lb\|[^\s]){1}((?!(lb\||\|lb))[^\n])+([^\s]\|lb){1})(?![0-9\.])))/gi;
  const orangeRegex =
    /(((?![0-9\.])o\|[^\s]+\|o(?![0-9]))|(((o\|[^\s]){1}((?!(o\||\|o))[^\n])+([^\s]\|o){1})(?![0-9\.])))/gi;
  const passionFruitRegex =
    /(((?![0-9\.])pf\|[^\s]+\|pf(?![0-9]))|(((pf\|[^\s]){1}((?!(pf\||\|pf))[^\n])+([^\s]\|pf){1})(?![0-9\.])))/gi;
  const pinkRegex =
    /(((?![0-9\.])p\|[^\s]+\|p(?![0-9]))|(((p\|[^\s]){1}((?!(p\||\|p))[^\n])+([^\s]\|p){1})(?![0-9\.])))/gi;
  const purpleRegex =
    /(((?![0-9\.])pu\|[^\s]+\|pu(?![0-9]))|(((pu\|[^\s]){1}((?!(pu\||\|pu))[^\n])+([^\s]\|pu){1})(?![0-9\.])))/gi;
  const redRegex =
    /(((?![0-9\.])r\|[^\s]+\|r(?![0-9]))|(((r\|[^\s]){1}((?!(r\||\|r))[^\n])+([^\s]\|r){1})(?![0-9\.])))/gi;
  const yellowRegex =
    /(((?![0-9\.])y\|[^\s]+\|y(?![0-9]))|(((y\|[^\s]){1}((?!(y\||\|y))[^\n])+([^\s]\|y){1})(?![0-9\.])))/gi;
  const fakeAtSymbolRegex = /＠/gi;
  const mentionRegex = /((?!([a-zA-Z1-9])).|^|\n)@[a-zA-Z0-9_]{3,}/gi;

  let result = string
    .replace(/(<br>)/gi, '\n')
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
    )
    .replace(
      italicRegex,
      (string) => `<i>${string.substring(2, string.length - 2)}</i>`
    )
    .replace(
      boldRegex,
      (string) => `<b>${string.substring(1, string.length - 1)}</b>`
    )
    .replace(
      underlineRegex,
      (string) => `<u>${string.substring(2, string.length - 2)}</u>`
    )
    .replace(
      lineThroughRegex,
      (string) => `<s>${string.substring(2, string.length - 2)}</s>`
    );

  if (hasMention) {
    result = (result || '').replace(mentionRegex, (string) => {
      const path = string.split('@')?.[1];
      const firstChar = string.split('@')?.[0];
      return `${firstChar}<a class="mention" href="/users/${path}">@${path}</a>`;
    });
  }
  result = (result || '').replace(/\n/g, '<br>');
  return isFinalProcessing ? result.replace(fakeAtSymbolRegex, '@') : result;
}

export function processedURL(url) {
  if (!url.includes('://')) {
    url = 'http://' + url;
  }
  return url;
}

export function queryStringForArray({ array, originVar, destinationVar }) {
  return `${array
    .map((elem) => `${destinationVar}[]=${originVar ? elem[originVar] : elem}`)
    .join('&')}`;
}

export function removeLineBreaks(string) {
  return string.replace(/\n/gi, ' ').replace(/ {2,}/gi, ' ');
}

export function renderFileSize(fileSize) {
  if (fileSize > 1_000_000) {
    return `(${(fileSize / 1_000_000).toFixed(2)} MB)`;
  }
  if (fileSize > 1000) {
    return `(${(fileSize / 1000).toFixed(2)} KB)`;
  }
  return null;
}

export function renderText(text) {
  let newText = text;
  while (
    newText !== '' &&
    (newText[0] === ' ' ||
      (newText[newText.length - 1] === ' ' &&
        newText[newText.length - 2] === ' '))
  ) {
    if (newText[0] === ' ') {
      newText = newText.substring(1);
    }
    if (
      newText[newText.length - 1] === ' ' &&
      newText[newText.length - 2] === ' '
    ) {
      newText = newText.slice(0, -1);
    }
  }
  return newText;
}

export function replaceFakeAtSymbol(string) {
  if (stringIsEmpty(string)) return '';
  return string.replace(/＠/g, '@');
}

export function generateFileName(fileName) {
  const splitFileName = fileName.split('.');
  const result = `${Math.floor(Date.now() / 1000)}.${
    splitFileName[splitFileName.length - 1]
  }`;
  return result;
}

export function stringIsEmpty(string) {
  const evalString = string || '';
  if (evalString && typeof evalString !== 'string') return true;
  return evalString.length === 0 || !evalString.trim();
}

export function translateMBToGB(size) {
  if (size >= 1000) {
    return `${size / 1000} GB`;
  }
  return `${size} MB`;
}

export function translateMBToGBWithoutSpace(size) {
  if (size >= 1000) {
    return `${size / 1000}GB`;
  }
  return `${size}MB`;
}

export function trimUrl(url) {
  const trimHttp = url?.split('//')[1] || url?.split('//')[0];
  const trimWWW = trimHttp?.split('www.')[1] || trimHttp?.split('www.')[0];
  return trimWWW;
}

export function trimWhiteSpaces(text) {
  let newText = text;
  while (
    newText !== '' &&
    (newText[0] === ' ' || newText[newText.length - 1] === ' ')
  ) {
    if (newText[0] === ' ') {
      newText = newText.substring(1);
    }
    if (newText[newText.length - 1] === ' ') {
      newText = newText.slice(0, -1);
    }
  }
  return newText;
}

export function truncateText({ text = '', limit }) {
  if (text?.length > limit) {
    return text.substring(0, limit) + '...';
  }
  return text;
}

export function stringsAreCaseInsensitivelyEqual(string1, string2) {
  if (typeof string1 !== 'string' || typeof string2 !== 'string') {
    return false;
  }
  return string1.toLowerCase() === string2.toLowerCase();
}
