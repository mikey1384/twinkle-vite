import { Buffer } from 'buffer';

async function loadPolyfills() {
  if (!window.IntersectionObserver) {
    await import('intersection-observer');
  }
  if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
  }
}

function fromEntries(entries: [string, any][]) {
  const res: { [key: string]: any } = {};
  for (let i = 0; i < entries.length; i++) res[entries[i][0]] = entries[i][1];
  return res;
}

if (!Object.fromEntries) Object.fromEntries = fromEntries;

import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faAlignJustify } from '@fortawesome/pro-solid-svg-icons/faAlignJustify';
import { faAward } from '@fortawesome/pro-solid-svg-icons/faAward';
import { faBullhorn } from '@fortawesome/pro-solid-svg-icons/faBullhorn';
import { faAndroid } from '@fortawesome/free-brands-svg-icons/faAndroid';
import { faApple } from '@fortawesome/free-brands-svg-icons/faApple';
import { faArchive } from '@fortawesome/pro-solid-svg-icons/faArchive';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons/faArrowLeft';
import { faArrowRight } from '@fortawesome/pro-solid-svg-icons/faArrowRight';
import { faArrowDown } from '@fortawesome/pro-solid-svg-icons/faArrowDown';
import { faArrowUp } from '@fortawesome/pro-solid-svg-icons/faArrowUp';
import { faBadgeDollar } from '@fortawesome/pro-solid-svg-icons/faBadgeDollar';
import { faBadgeDollar as farBadgeDollar } from '@fortawesome/pro-regular-svg-icons/faBadgeDollar';
import { faBadgeDollar as falBadgeDollar } from '@fortawesome/pro-light-svg-icons/faBadgeDollar';
import { faBan } from '@fortawesome/pro-solid-svg-icons/faBan';
import { faBars } from '@fortawesome/pro-solid-svg-icons/faBars';
import { faBatteryFull } from '@fortawesome/pro-solid-svg-icons/faBatteryFull';
import { faBatteryEmpty } from '@fortawesome/pro-solid-svg-icons/faBatteryEmpty';
import { faBolt } from '@fortawesome/pro-solid-svg-icons/faBolt';
import { faBook } from '@fortawesome/pro-solid-svg-icons/faBook';
import { faBookOpen } from '@fortawesome/pro-solid-svg-icons/faBookOpen';
import { faBookmark } from '@fortawesome/pro-solid-svg-icons/faBookmark';
import { faBookmark as farBookmark } from '@fortawesome/pro-regular-svg-icons/faBookmark';
import { faBrain } from '@fortawesome/pro-solid-svg-icons/faBrain';
import { faBriefcase } from '@fortawesome/pro-solid-svg-icons/faBriefcase';
import { faCameraAlt } from '@fortawesome/pro-solid-svg-icons/faCameraAlt';
import { faCameraSlash } from '@fortawesome/pro-solid-svg-icons/faCameraSlash';
import { faCardsBlank } from '@fortawesome/pro-solid-svg-icons/faCardsBlank';
import { faCaretDown } from '@fortawesome/pro-solid-svg-icons/faCaretDown';
import { faCertificate } from '@fortawesome/pro-solid-svg-icons/faCertificate';
import { faCertificate as farCertificate } from '@fortawesome/pro-regular-svg-icons/faCertificate';
import { faChalkboardTeacher } from '@fortawesome/pro-solid-svg-icons/faChalkboardTeacher';
import { faCheck } from '@fortawesome/pro-solid-svg-icons/faCheck';
import { faCheckCircle } from '@fortawesome/pro-solid-svg-icons/faCheckCircle';
import { faChess } from '@fortawesome/pro-solid-svg-icons/faChess';
import { faChevronUp } from '@fortawesome/pro-solid-svg-icons/faChevronUp';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons/faChevronDown';
import { faChevronLeft } from '@fortawesome/pro-solid-svg-icons/faChevronLeft';
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons/faChevronRight';
import { faClipboardCheck } from '@fortawesome/pro-solid-svg-icons/faClipboardCheck';
import { faClockRotateLeft } from '@fortawesome/pro-solid-svg-icons/faClockRotateLeft';
import { faCloudUploadAlt } from '@fortawesome/pro-solid-svg-icons/faCloudUploadAlt';
import { faCode } from '@fortawesome/pro-solid-svg-icons/faCode';
import { faCodeBranch } from '@fortawesome/pro-solid-svg-icons/faCodeBranch';
import { faComment } from '@fortawesome/pro-solid-svg-icons/faComment';
import { faCommentAlt } from '@fortawesome/pro-solid-svg-icons/faCommentAlt';
import { faComments } from '@fortawesome/pro-solid-svg-icons/faComments';
import { faCopy } from '@fortawesome/pro-solid-svg-icons/faCopy';
import { faCrown } from '@fortawesome/pro-solid-svg-icons/faCrown';
import { faDharmachakra } from '@fortawesome/pro-solid-svg-icons/faDharmachakra';
import { faDesktop } from '@fortawesome/pro-solid-svg-icons/faDesktop';
import { faDownload } from '@fortawesome/pro-solid-svg-icons/faDownload';
import { faEllipsisH } from '@fortawesome/pro-solid-svg-icons/faEllipsisH';
import { faExclamationCircle } from '@fortawesome/pro-solid-svg-icons/faExclamationCircle';
import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons/faExclamationTriangle';
import { faExchangeAlt } from '@fortawesome/pro-solid-svg-icons/faExchangeAlt';
import { faFilm } from '@fortawesome/pro-solid-svg-icons/faFilm';
import { faFile } from '@fortawesome/pro-solid-svg-icons/faFile';
import { faFileArchive } from '@fortawesome/pro-solid-svg-icons/faFileArchive';
import { faFileAudio } from '@fortawesome/pro-solid-svg-icons/faFileAudio';
import { faFilePdf } from '@fortawesome/pro-solid-svg-icons/faFilePdf';
import { faFileText } from '@fortawesome/pro-solid-svg-icons/faFileText';
import { faFileCsv } from '@fortawesome/pro-solid-svg-icons/faFileCsv';
import { faFileVideo } from '@fortawesome/pro-solid-svg-icons/faFileVideo';
import { faFileWord } from '@fortawesome/pro-solid-svg-icons/faFileWord';
import { faLink } from '@fortawesome/pro-solid-svg-icons/faLink';
import { faFire } from '@fortawesome/pro-solid-svg-icons/faFire';
import { faFolderOpen } from '@fortawesome/pro-solid-svg-icons/faFolderOpen';
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';
import { faGlobe } from '@fortawesome/pro-solid-svg-icons/faGlobe';
import { faLevelUp } from '@fortawesome/pro-solid-svg-icons/faLevelUp';
import { faHeart } from '@fortawesome/pro-solid-svg-icons/faHeart';
import { faHandHolding } from '@fortawesome/pro-solid-svg-icons/faHandHolding';
import { faHeartSquare } from '@fortawesome/pro-solid-svg-icons/faHeartSquare';
import { faHistory } from '@fortawesome/pro-solid-svg-icons/faHistory';
import { faHome } from '@fortawesome/pro-solid-svg-icons/faHome';
import { faHtml5 } from '@fortawesome/free-brands-svg-icons/faHtml5';
import { faIndent } from '@fortawesome/pro-solid-svg-icons/faIndent';
import { faInfoCircle } from '@fortawesome/pro-solid-svg-icons/faInfoCircle';
import { faImage } from '@fortawesome/pro-solid-svg-icons/faImage';
import { faJs } from '@fortawesome/free-brands-svg-icons/faJs';
import { faLeftToLine } from '@fortawesome/pro-solid-svg-icons/faLeftToLine';
import { faLightbulb } from '@fortawesome/pro-solid-svg-icons/faLightbulb';
import { faList } from '@fortawesome/pro-solid-svg-icons/faList';
import { faLock } from '@fortawesome/pro-solid-svg-icons/faLock';
import { faMicrophone } from '@fortawesome/pro-solid-svg-icons/faMicrophone';
import { faMicrophoneSlash } from '@fortawesome/pro-solid-svg-icons/faMicrophoneSlash';
import { faMoneyBillTrendUp } from '@fortawesome/pro-solid-svg-icons/faMoneyBillTrendUp';
import { faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons/faMagnifyingGlass';
import { faMinus } from '@fortawesome/pro-solid-svg-icons/faMinus';
import { faMobileAlt } from '@fortawesome/pro-solid-svg-icons/faMobileAlt';
import { faPaperclip } from '@fortawesome/pro-solid-svg-icons/faPaperclip';
import { faPaperPlane } from '@fortawesome/pro-solid-svg-icons/faPaperPlane';
import { faPencilAlt } from '@fortawesome/pro-solid-svg-icons/faPencilAlt';
import { faPhoneSlash } from '@fortawesome/pro-solid-svg-icons/faPhoneSlash';
import { faPhoneVolume } from '@fortawesome/pro-solid-svg-icons/faPhoneVolume';
import { faPlay } from '@fortawesome/pro-solid-svg-icons/faPlay';
import { faPlus } from '@fortawesome/pro-solid-svg-icons/faPlus';
import { faPortalEnter } from '@fortawesome/pro-solid-svg-icons/faPortalEnter';
import { faQuestion } from '@fortawesome/pro-solid-svg-icons/faQuestion';
import { faQuestionCircle } from '@fortawesome/pro-solid-svg-icons/faQuestionCircle';
import { faRankingStar } from '@fortawesome/pro-solid-svg-icons/faRankingStar';
import { faReact } from '@fortawesome/free-brands-svg-icons/faReact';
import { faRecycle } from '@fortawesome/pro-solid-svg-icons/faRecycle';
import { faRedo } from '@fortawesome/pro-solid-svg-icons/faRedo';
import { faRepeat } from '@fortawesome/pro-solid-svg-icons/faRepeat';
import { faReply } from '@fortawesome/pro-solid-svg-icons/faReply';
import { faRightFromBracket } from '@fortawesome/pro-solid-svg-icons/faRightFromBracket';
import { faRobot } from '@fortawesome/pro-solid-svg-icons/faRobot';
import { faRocketLaunch } from '@fortawesome/pro-solid-svg-icons/faRocketLaunch';
import { faSave } from '@fortawesome/pro-solid-svg-icons/faSave';
import { faSearch } from '@fortawesome/pro-solid-svg-icons/faSearch';
import { faSchool } from '@fortawesome/pro-solid-svg-icons/faSchool';
import { faShoppingCart } from '@fortawesome/pro-solid-svg-icons/faShoppingCart';
import { faShoppingBag } from '@fortawesome/pro-solid-svg-icons/faShoppingBag';
import { faSignOutAlt } from '@fortawesome/pro-solid-svg-icons/faSignOutAlt';
import { faSlidersH } from '@fortawesome/pro-solid-svg-icons/faSlidersH';
import { faSort } from '@fortawesome/pro-solid-svg-icons/faSort';
import { faSparkles } from '@fortawesome/pro-solid-svg-icons/faSparkles';
import { faSpellCheck } from '@fortawesome/pro-solid-svg-icons/faSpellCheck';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons/faSpinner';
import { faStar } from '@fortawesome/pro-solid-svg-icons/faStar';
import { faStarHalfAlt } from '@fortawesome/pro-solid-svg-icons/faStarHalfAlt';
import { faStar as farStar } from '@fortawesome/pro-regular-svg-icons/faStar';
import { faStarHalfAlt as farStarHalfAlt } from '@fortawesome/pro-regular-svg-icons/faStarHalfAlt';
import { faStop } from '@fortawesome/pro-solid-svg-icons/faStop';
import { faSurprise } from '@fortawesome/pro-solid-svg-icons/faSurprise';
import { faTasks } from '@fortawesome/pro-solid-svg-icons/faTasks';
import { faThumbtack } from '@fortawesome/pro-solid-svg-icons/faThumbtack';
import { faThumbsDown } from '@fortawesome/pro-solid-svg-icons/faThumbsDown';
import { faThumbsUp } from '@fortawesome/pro-solid-svg-icons/faThumbsUp';
import { faTimes } from '@fortawesome/pro-solid-svg-icons/faTimes';
import { faTrashAlt } from '@fortawesome/pro-solid-svg-icons/faTrashAlt';
import { faTrashRestore } from '@fortawesome/pro-solid-svg-icons/faTrashRestore';
import { faTree } from '@fortawesome/pro-solid-svg-icons/faTree';
import { faTrophy } from '@fortawesome/pro-solid-svg-icons/faTrophy';
import { faUndo } from '@fortawesome/pro-solid-svg-icons/faUndo';
import { faUnlock } from '@fortawesome/pro-solid-svg-icons/faUnlock';
import { faUser } from '@fortawesome/pro-solid-svg-icons/faUser';
import { faUserPlus } from '@fortawesome/pro-solid-svg-icons/faUserPlus';
import { faUpload } from '@fortawesome/pro-solid-svg-icons/faUpload';
import { faUserGraduate } from '@fortawesome/pro-solid-svg-icons/faUserGraduate';
import { faUsers } from '@fortawesome/pro-solid-svg-icons/faUsers';
import { faUserGroupCrown } from '@fortawesome/pro-solid-svg-icons/faUserGroupCrown';
import { faVolume } from '@fortawesome/pro-solid-svg-icons/faVolume';
import { faVolumeMute } from '@fortawesome/pro-solid-svg-icons/faVolumeMute';
import { faWandMagicSparkles } from '@fortawesome/pro-solid-svg-icons/faWandMagicSparkles';
import { faWindows } from '@fortawesome/free-brands-svg-icons/faWindows';
import { faXmark } from '@fortawesome/pro-solid-svg-icons/faXmark';
import { faYoutube } from '@fortawesome/free-brands-svg-icons/faYoutube';
import { AppContextProvider } from './contexts';
import App from './containers/App';
import { install } from 'resize-observer';

if (!window.ResizeObserver) install();

declare global {
  interface Document {
    msHidden?: boolean;
    webkitHidden?: boolean;
    msvisibilitychange?: string;
    webkitvisibilitychange?: string;
  }
  interface Window {
    loadImage: (
      imageUri: string,
      callback: (img: any) => void,
      options?: any
    ) => void;
    gtag: (
      type: string,
      eventName: string,
      options: {
        page_path?: string;
        page_search?: string;
        page_hash?: string;
      }
    ) => void;
  }
}

library.add(
  faAlignJustify,
  faAndroid,
  faApple,
  faArchive,
  faArrowLeft,
  faArrowRight,
  faArrowDown,
  faArrowUp,
  faAward,
  faBullhorn,
  faBadgeDollar,
  farBadgeDollar,
  falBadgeDollar,
  faBan,
  faBars,
  faBatteryFull,
  faBatteryEmpty,
  faBolt,
  faBook,
  faBookOpen,
  faBookmark,
  farBookmark,
  faBrain,
  faBriefcase,
  faCode,
  faCodeBranch,
  faCameraAlt,
  faCameraSlash,
  faCardsBlank,
  faCaretDown,
  faCertificate,
  farCertificate,
  faChalkboardTeacher,
  faCheck,
  faCheckCircle,
  faChess,
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faClipboardCheck,
  faClockRotateLeft,
  faCloudUploadAlt,
  faComment,
  faCommentAlt,
  faComments,
  faCopy,
  faCrown,
  faDharmachakra,
  faDesktop,
  faDownload,
  faEllipsisH,
  faExchangeAlt,
  faExclamationCircle,
  faExclamationTriangle,
  faFile,
  faFileArchive,
  faFileAudio,
  faFilePdf,
  faFileCsv,
  faFileText,
  faFileVideo,
  faFileWord,
  faFilm,
  faFire,
  faFolderOpen,
  faGithub,
  faGlobe,
  faHandHolding,
  faHeart,
  faHeartSquare,
  faHistory,
  faHome,
  faHtml5,
  faImage,
  faIndent,
  faInfoCircle,
  faJs,
  faLevelUp,
  faLeftToLine,
  faLightbulb,
  faLink,
  faList,
  faLock,
  faMagnifyingGlass,
  faMicrophone,
  faMicrophoneSlash,
  faMinus,
  faMobileAlt,
  faMoneyBillTrendUp,
  faPaperclip,
  faPaperPlane,
  faPencilAlt,
  faPhoneSlash,
  faPhoneVolume,
  faPlay,
  faPlus,
  faPortalEnter,
  faQuestionCircle,
  faRankingStar,
  faReact,
  faRecycle,
  faRedo,
  faRepeat,
  faReply,
  faRightFromBracket,
  faRobot,
  faRocketLaunch,
  faQuestion,
  faSchool,
  faShoppingCart,
  faShoppingBag,
  faSave,
  faSearch,
  faSignOutAlt,
  faSlidersH,
  faSort,
  faSparkles,
  faSpinner,
  faSpellCheck,
  faStar,
  faStarHalfAlt,
  faStop,
  farStar,
  farStarHalfAlt,
  faSurprise,
  faTasks,
  faThumbsDown,
  faThumbsUp,
  faThumbtack,
  faTimes,
  faTrashAlt,
  faTrashRestore,
  faTree,
  faTrophy,
  faUpload,
  faUndo,
  faUnlock,
  faUser,
  faUserPlus,
  faUserGraduate,
  faUserGroupCrown,
  faUsers,
  faVolume,
  faVolumeMute,
  faWandMagicSparkles,
  faWindows,
  faXmark,
  faYoutube
);

(async () => {
  await loadPolyfills();

  const rootElement = document.getElementById('react-view');

  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <BrowserRouter>
        <ErrorBoundary componentPath="AppContext">
          <AppContextProvider>
            <App />
          </AppContextProvider>
        </ErrorBoundary>
      </BrowserRouter>
    );
  } else {
    console.error('Could not find the root element with the ID "react-view".');
  }
})();
