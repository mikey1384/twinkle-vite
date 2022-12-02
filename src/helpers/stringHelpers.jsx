import parse from 'html-react-parser';
import Link from '~/components/Link';
import { charLimit } from '~/constants/defaultValues';
/* eslint-disable no-useless-escape */

// previously used urlRegex: /(((http[s]?:\/\/|ftp:\/\/)|www\.)+([0-9a-zA-Z\p{L}\-])+(\.[a-zA-Z]{1,3})+([0-9\p{L}.,;:?!&@%_\-\+~#=\/()\[\]])*[^.,;:?!"'\n\)\]<* ])/giu;

const urlRegex =
  /((https?:\/\/|ftp:\/\/|www\.)\S+\.[^()\n ]+((?:\([^)]*\))|[^.,;:?!"'\n\)\]<* ])+)/giu;
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
  if (!string) {
    return '';
  }
  let firstPart = string.substring(0, string.length - 3);
  let lastPart = addTwoLetterEmoji(string.slice(-3));
  let firstResult = `${firstPart}${lastPart}`;

  firstPart = firstResult.substring(0, firstResult.length - 4);
  lastPart = addThreeLetterEmoji(firstResult.slice(-4));
  return `${firstPart}${lastPart}`;
}

export function addTwoLetterEmoji(string) {
  return string
    .replace(/(:\) )/g, '😊 ')
    .replace(/(:\] )/g, '🙂 ')
    .replace(/(\(: )/g, '🙃 ')
    .replace(/(;\) )/g, '😉 ')
    .replace(/(XD )/g, '😆 ')
    .replace(/(xD )/g, '😆 ')
    .replace(/(xd )/g, '😆 ')
    .replace(/(:D )/g, '😄 ')
    .replace(/(:P )/gi, '😛 ')
    .replace(/(:\( )/g, '🙁 ')
    .replace(/(:O )/gi, '😲 ')
    .replace(/(<3 )/g, '❤️ ');
}

export function addThreeLetterEmoji(string) {
  return string
    .replace(/(:-\) )/g, '😊 ')
    .replace(/(\(: )/g, '🙃')
    .replace(/(;-\) )/g, '😉 ')
    .replace(/(X-D )/g, '😆 ')
    .replace(/(:-D )/g, '😄 ')
    .replace(/(:-P )/gi, '😛 ')
    .replace(/(:-\\ )/g, '😕 ')
    .replace(/(:-\( )/g, '😕 ')
    .replace(/(:-O )/gi, '😲 ')
    .replace(/(O_O )/gi, '😳 ');
}

export function addAdvancedEmoji(string) {
  return string
    .replace(/(:\) )/g, '😊 ')
    .replace(/(;\) )/g, '😉 ')
    .replace(/(:P )/gi, '😛 ')
    .replace(/(:\( )/g, '🙁 ')
    .replace(/(:o )/gi, '😲 ')
    .replace(/(:O )/gi, '😲 ')
    .replace(/(<3 )/g, '❤️ ')
    .replace(/(:-\) )/g, '😊 ')
    .replace(/(;-\) )/g, '😉 ')
    .replace(/(X-D )/g, '😆 ')
    .replace(/(XD )/g, '😆 ')
    .replace(/(xD )/g, '😆 ')
    .replace(/(:D )/g, '😄 ')
    .replace(/(:-D )/g, '😄 ')
    .replace(/(:-P )/gi, '😛 ')
    .replace(/(:-\( )/g, '🙁 ')
    .replace(/(:-O )/gi, '😲 ')
    .replace(/(O_O )/gi, '😳 ')
    .replace(/(\:alien\:)/gi, '👽')
    .replace(/(\:america\:)/gi, '🇺🇸')
    .replace(/(\:agony\:)/gi, '😩')
    .replace(/(\:angel\:)/gi, '😇')
    .replace(/(\:angry\:)/gi, '😡')
    .replace(/(\:ant\:)/gi, '🐜')
    .replace(/(\:bad\:)/gi, '👎')
    .replace(/(\:ball\:)/gi, '⚽')
    .replace(/(\:bear\:)/gi, '🐻')
    .replace(/(\:bee\:)/gi, '🐝')
    .replace(/(\:bird\:)/gi, '🐦')
    .replace(/(\:brofist\:)/gi, '👊')
    .replace(/(\:bunny\:)/gi, '🐰')
    .replace(/(\:burger\:)/gi, '🍔')
    .replace(/(\:butterfly\:)/gi, '🦋')
    .replace(/(\:bye\:)/gi, '👋')
    .replace(/(\:cake\:)/gi, '🍰')
    .replace(/(\:cash\:)/gi, '💰')
    .replace(/(\:cat\:)/gi, '🐱')
    .replace(/(\:chess\:)/gi, '♟️')
    .replace(/(\:cherry\:)/gi, '🍒')
    .replace(/(\:chicken\:)/gi, '🍗')
    .replace(/(\:china\:)/gi, '🇨🇳')
    .replace(/(\:christmas\:)/gi, '🎄')
    .replace(/(\:clap\:)/gi, '👏')
    .replace(/(\:colored pencil\:)/gi, '🖍️')
    .replace(/(\:computer\:)/gi, '🖥')
    .replace(/(\:congrats\:)/gi, '🎊')
    .replace(/(\:congratulations\:)/gi, '🎊')
    .replace(/(\:confounded\:)/gi, '😖')
    .replace(/(\:confused\:)/gi, '😕')
    .replace(/(\:cow\:)/gi, '🐮')
    .replace(/(\:crayon\:)/gi, '🖍️')
    .replace(/(\:curious\:)/gi, '🤔')
    .replace(/(\:cry\:)/gi, '😭')
    .replace(/(\:deer\:)/gi, '🦌')
    .replace(/(\:degree\:)/gi, '°')
    .replace(/(\:devil\:)/gi, '😈')
    .replace(/(\:diamond\:)/gi, '💎')
    .replace(/(\:dinosaur\:)/gi, '🦖')
    .replace(/(\:divide\:)/gi, '÷')
    .replace(/(\:dog\:)/gi, '🐶')
    .replace(/(\:dolphin\:)/gi, '🐬')
    .replace(/(\:duck\:)/gi, '🦆')
    .replace(/(\:elephant\:)/gi, '🐘')
    .replace(/(\:evil\:)/gi, '😈')
    .replace(/(\:exclamation\:)/gi, '❗')
    .replace(/(\:eyeglasses\:)/gi, '👓')
    .replace(/(\:eyes\:)/gi, '👀')
    .replace(/(\:facepalm\:)/gi, '🤦')
    .replace(/(\:fear\:)/gi, '😱')
    .replace(/(\:fire\:)/gi, '🔥')
    .replace(/(\:flex\:)/gi, '💪')
    .replace(/(\:fox\:)/gi, '🦊')
    .replace(/(\:food\:)/gi, '🍔')
    .replace(/(\:friend\:)/gi, '👭')
    .replace(/(\:ghost\:)/gi, '👻')
    .replace(/(\:gift\:)/gi, '🎁')
    .replace(/(\:good\:)/gi, '👍')
    .replace(/(\:goose\:)/gi, '🦢')
    .replace(/(\:gross\:)/gi, '🤢')
    .replace(/(\:hamster\:)/gi, '🐹')
    .replace(/(\:happy\:)/gi, '😄')
    .replace(/(\:heart\:)/gi, '❤️')
    .replace(/(\:hello\:)/gi, '👋')
    .replace(/(\:hi\:)/gi, '👋')
    .replace(/(\:helpless\:)/gi, '😣')
    .replace(/(\:hen\:)/gi, '🐔')
    .replace(/(\:hmmm\:)/gi, '🧐')
    .replace(/(\:horror\:)/gi, '😱')
    .replace(/(\:horse\:)/gi, '🐴')
    .replace(/(\:hug\:)/gi, '🤗')
    .replace(/(\:icecream\:)/gi, '🍦')
    .replace(/(\:infinity\:)/gi, '∞')
    .replace(/(\:japan\:)/gi, '🇯🇵')
    .replace(/(\:korea\:)/gi, '🇰🇷')
    .replace(/(\:light\:)/gi, '💡')
    .replace(/(\:lightbulb\:)/gi, '💡')
    .replace(/(\:lock\:)/gi, '🔒')
    .replace(/(\:lol\:)/gi, '🤣')
    .replace(/(\:love\:)/gi, '😍')
    .replace(/(\:mad\:)/gi, '😡')
    .replace(/(\:mindblown\:)/gi, '🤯')
    .replace(/(\:mindblowing\:)/gi, '🤯')
    .replace(/(\:money\:)/gi, '💰')
    .replace(/(\:monkey\:)/gi, '🐵')
    .replace(/(\:monocle\:)/gi, '🧐')
    .replace(/(\:moo\:)/gi, '🐮')
    .replace(/(\:moose\:)/gi, '🦌')
    .replace(/(\:mouse\:)/gi, '🐭')
    .replace(/(\:multiply\:)/gi, '×')
    .replace(/(\:neutral\:)/gi, '😐')
    .replace(/(\:nice\:)/gi, '👍')
    .replace(/(\:ok\:)/gi, '👌')
    .replace(/(\:okay\:)/gi, '👌')
    .replace(/(\:paint\:)/gi, '🎨')
    .replace(/(\:palette\:)/gi, '🎨')
    .replace(/(\:party\:)/gi, '🎉')
    .replace(/(\:peace\:)/gi, '✌️')
    .replace(/(\:penguin\:)/gi, '🐧')
    .replace(/(\:perfect\:)/gi, '💯')
    .replace(/(\:pi\:)/gi, 'π')
    .replace(/(\:pig\:)/gi, '🐷')
    .replace(/(\:pineapple\:)/gi, '🍍')
    .replace(/(\:pizza\:)/gi, '🍕')
    .replace(/(\:poo\:)/gi, '💩')
    .replace(/(\:poop\:)/gi, '💩')
    .replace(/(\:potato\:)/gi, '🥔')
    .replace(/(\:present\:)/gi, '🎁')
    .replace(/(\:puke\:)/gi, '🤮')
    .replace(/(\:puppy\:)/gi, '🐶')
    .replace(/(\:question\:)/gi, '❓')
    .replace(/(\:rainbow\:)/gi, '🌈')
    .replace(/(\:rabbit\:)/gi, '🐰')
    .replace(/(\:reindeer\:)/gi, '🦌')
    .replace(/(\:repeat\:)/gi, '🔁')
    .replace(/(\:restroom\:)/gi, '🚻')
    .replace(/(\:ribbon\:)/gi, '🎀')
    .replace(/(\:robot\:)/gi, '🤖')
    .replace(/(\:rocket\:)/gi, '🚀')
    .replace(/(\:rooster\:)/gi, '🐓')
    .replace(/(\:sad\:)/gi, '😢')
    .replace(/(\:santa\:)/gi, '🎅')
    .replace(/(\:shock\:)/gi, '😱')
    .replace(/(\:shocked\:)/gi, '😱')
    .replace(/(\:sick\:)/gi, '🤒')
    .replace(/(\:shrug\:)/gi, '🤷')
    .replace(/(\:smh\:)/gi, '🤦')
    .replace(/(\:smile\:)/gi, '😊')
    .replace(/(\:smirk\:)/gi, '😏')
    .replace(/(\:snail\:)/gi, '🐌')
    .replace(/(\:spider\:)/gi, '🕷️')
    .replace(/(\:squared\:)/gi, '²')
    .replace(/(\:star\:)/gi, '⭐')
    .replace(/(\:starstruck\:)/gi, '🤩')
    .replace(/(\:strawberry\:)/gi, '🍓')
    .replace(/(\:sunglasses\:)/gi, '😎')
    .replace(/(\:swan\:)/gi, '🦢')
    .replace(/(\:taco\:)/gi, '🌮')
    .replace(/(\:tasty\:)/gi, '😋')
    .replace(/(\:tears\:)/gi, '😢')
    .replace(/(\:thanks\:)/gi, '🙏')
    .replace(/(\:thank you\:)/gi, '🙏')
    .replace(/(\:theta\:)/gi, '⍬')
    .replace(/(\:thumb\:)/gi, '👍')
    .replace(/(\:thumbs\:)/gi, '👍')
    .replace(/(\:tup\:)/gi, '👍')
    .replace(/(\:tdown\:)/gi, '👎')
    .replace(/(\:tiger\:)/gi, '🐯')
    .replace(/(\:traffic\:)/gi, '🚥')
    .replace(/(\:trafficlight\:)/gi, '🚥')
    .replace(/(\:trash\:)/gi, '🗑')
    .replace(/(\:triangle\:)/gi, '△')
    .replace(/(\:troll\:)/gi, '🤬')
    .replace(/(\:turtle\:)/gi, '🐢')
    .replace(/(\:twinkle\:)/gi, '✨')
    .replace(/(\:ufo\:)/gi, '🛸')
    .replace(/(\:usa\:)/gi, '🇺🇸')
    .replace(/(\:volcano\:)/gi, '🌋')
    .replace(/(\:vomit\:)/gi, '🤮')
    .replace(/(\:wave\:)/gi, '👋')
    .replace(/(\:weary\:)/gi, '😩')
    .replace(/(\:wink\:)/gi, '😉')
    .replace(/(\:wow\:)/gi, '😲')
    .replace(/(\:yep\:)/gi, '👌')
    .replace(/(\:yes\:)/gi, '👌')
    .replace(/(\:yum\:)/gi, '😋')
    .replace(/(\:yummy\:)/gi, '😋')
    .replace(/(\:zombie\:)/gi, '🧟')
    .replace(/(\:zipper\:)/gi, '🤐')
    .replace(/(\:zzz\:)/gi, '💤')
    .replace(/(\:\^\^\:)/gi, '😊');
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
  let finalizedString = addAdvancedEmoji(
    addEmoji(expandShortcut(string + ' '))
  );
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
    displayedContent = content.substr(8);
  }
  if (content.startsWith('/spoiler ')) {
    displayedContent = content.substr(9);
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
      return applyTextEffects(splitPart[0]);
    }
    return [splitPart[0], applyTextEffects(splitPart[1])].join('</a>');
  });
  return applyTextEffects(splitNewStringWithTextEffects.join('<a href'), true);

  function applyTextSize(string) {
    const hugeWordRegex = /(h\[[^\s]+\]h)/gi;
    const hugeSentenceRegex =
      /((h\[[^\s]){1}((?!(h\[|\]h))[^\n])+([^\s]\]h){1})/gi;
    const bigWordRegex = /(b\[[^\s]+\]b)/gi;
    const bigSentenceRegex =
      /((b\[[^\s]){1}((?!(b\[|\]b))[^\n])+([^\s]\]b){1})/gi;
    const smallWordRegex = /(s\[[^\s]+\]s)/gi;
    const smallSentenceRegex =
      /((s\[[^\s]){1}((?!(s\[|\]s))[^\n])+([^\s]\]s){1})/gi;
    const tinyWordRegex = /(t\[[^\s]+\]t)/gi;
    const tinySentenceRegex =
      /((t\[[^\s]){1}((?!(t\[|\]t))[^\n])+([^\s]\]t){1})/gi;

    return string
      .replace(
        hugeWordRegex,
        (string) =>
          `<span style="font-size: 1.9em;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        bigWordRegex,
        (string) =>
          `<span style="font-size: 1.4em;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        smallWordRegex,
        (string) =>
          `<span style="font-size: 0.7em;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        tinyWordRegex,
        (string) =>
          `<span style="font-size: 0.5em;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        smallSentenceRegex,
        (string) =>
          `<span style="font-size: 0.7em;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        tinySentenceRegex,
        (string) =>
          `<span style="font-size: 0.5em;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        bigSentenceRegex,
        (string) =>
          `<span style="font-size: 1.4em;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      )
      .replace(
        hugeSentenceRegex,
        (string) =>
          `<span style="font-size: 1.9em;">${string.substring(
            2,
            string.length - 2
          )}</span>`
      );
  }
}

export function applyTextEffects(string, finalProcessing) {
  const boldRegex =
    /(((?![0-9\.])\*[^\s*]+\*(?![0-9]))|(((\*[^\s]){1}((?!(\*))[^\n])+([^\s]\*){1})(?![0-9\.])))/gi;
  const italicRegex =
    /(((?![0-9\.])\*\*[^\s*]+\*\*(?![0-9]))|(((\*\*[^\s]){1}((?!(\*\*))[^\n])+([^\s]\*\*){1})(?![0-9\.])))/gi;
  const underlineRegex =
    /(((?![0-9\.])__[^_]+__(?![0-9]))|(((__[^_]){1}((?!(__))[^\n])+([^_]\__){1})(?![0-9\.])))/gi;
  const lineThroughRegex =
    /(((?![0-9\.])--[^-]+--(?![0-9]))|(((--[^-]){1}((?!(--))[^\n])+([^-\-]\--){1})(?![0-9\.])))/gi;
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

  const result = string
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
      boldRegex,
      (string) => `<b>${string.substring(1, string.length - 1)}</b>`
    )
    .replace(
      italicRegex,
      (string) => `<i>${string.substring(2, string.length - 2)}</i>`
    )
    .replace(
      underlineRegex,
      (string) => `<u>${string.substring(2, string.length - 2)}</u>`
    )
    .replace(
      lineThroughRegex,
      (string) => `<s>${string.substring(2, string.length - 2)}</s>`
    )
    .replace(mentionRegex, (string) => {
      const path = string.split('@')?.[1];
      const firstChar = string.split('@')?.[0];
      return `${firstChar}<a class="mention" href="/users/${path}">@${path}</a>`;
    })
    .replace(/\n/g, '<br>');
  return finalProcessing ? result.replace(fakeAtSymbolRegex, '@') : result;
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

export function turnStringIntoQuestion(string) {
  const toDelete = ['?', ' '];
  while (toDelete.indexOf(string.charAt(string.length - 1)) !== -1) {
    string = string.slice(0, -1);
  }
  return string + '?';
}

export function stringsAreCaseInsensitivelyEqual(string1, string2) {
  const string1IsString = typeof string1 === 'string';
  const string2IsString = typeof string2 === 'string';
  if (!string1IsString || !string2IsString) {
    return false;
  }
  return string1.toLowerCase() === string2.toLowerCase();
}

/* eslint-enable no-useless-escape */
