import { Link, PlaylistVideo, Playlist, Subject } from '~/types';

export default function ExploreReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  switch (action.type) {
    case 'CHANGE_PLAYLIST_VIDEOS':
      return {
        ...state,
        videos: {
          ...state.videos,
          featuredPlaylists: state.videos.featuredPlaylists.map(
            (playlist: Playlist) =>
              playlist.id === action.playlist.id
                ? { ...playlist, ...action.playlist }
                : playlist
          ),
          allPlaylists: state.videos.allPlaylists.map((playlist: Playlist) =>
            playlist.id === action.playlist.id
              ? { ...playlist, ...action.playlist }
              : playlist
          ),
          searchedPlaylists: state.videos.searchedPlaylists.map(
            (playlist: Playlist) =>
              playlist.id === action.playlist.id
                ? { ...playlist, ...action.playlist }
                : playlist
          )
        }
      };
    case 'CHANGE_FEATURED_PLAYLISTS':
      return {
        ...state,
        videos: {
          ...state.videos,
          featuredPlaylists: action.data
        }
      };
    case 'CHANGE_SEARCH_INPUT':
      return {
        ...state,
        search: {
          ...state.search,
          searchText: action.text
        }
      };
    case 'CHANGE_VIDEO_BY_USER_STATUS':
      return {
        ...state,
        videos: {
          ...state.videos,
          featuredPlaylists: state.videos.featuredPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.map((video) =>
                video.videoId === action.videoId
                  ? {
                      ...video,
                      byUser: action.byUser
                    }
                  : video
              )
            })
          ),
          allPlaylists: state.videos.allPlaylists.map((playlist: Playlist) => ({
            ...playlist,
            playlist: playlist.playlist.map((video) =>
              video.videoId === action.videoId
                ? {
                    ...video,
                    byUser: action.byUser
                  }
                : video
            )
          })),
          searchedPlaylists: state.videos.searchedPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.map((video) =>
                video.videoId === action.videoId
                  ? {
                      ...video,
                      byUser: action.byUser
                    }
                  : video
              )
            })
          )
        }
      };
    case 'CLEAR_AI_CARDS_LOADED':
      return {
        ...state,
        aiCards: {
          ...state.aiCards,
          loaded: false
        }
      };
    case 'CLEAR_LINKS_LOADED':
      return {
        ...state,
        links: {
          ...state.links,
          loaded: false
        }
      };
    case 'CLEAR_VIDEOS_LOADED':
      return {
        ...state,
        videos: {
          ...state.videos,
          continueWatchingLoaded: false,
          allPlaylistsLoaded: false,
          featuredPlaylistsLoaded: false
        }
      };
    case 'CLOSE_PLAYLIST_MODAL':
      return {
        ...state,
        videos: {
          ...state.videos,
          addPlaylistModalShown: false
        }
      };
    case 'CLOSE_REORDER_FEATURED_PL_MODAL':
      return {
        ...state,
        videos: {
          ...state.videos,
          reorderFeaturedPlaylistsShown: false
        }
      };
    case 'CLOSE_SELECT_FEATURED_PL_MODAL':
      return {
        ...state,
        videos: {
          ...state.videos,
          loadMoreFeaturedPlaylistsButton: false,
          selectFeaturedPlaylistsModalShown: false
        }
      };
    case 'DELETE_LINK':
      return {
        ...state,
        links: {
          ...state.links,
          byUserLinks: state.links.byUserLinks.filter(
            (link: Link) => link.id !== action.linkId
          ),
          recommendeds: state.links.recommendeds.filter(
            (link: Link) => link.id !== action.linkId
          ),
          links: state.links.links.filter(
            (link: Link) => link.id !== action.linkId
          )
        }
      };
    case 'DELETE_PLAYLIST':
      return {
        ...state,
        videos: {
          ...state.videos,
          featuredPlaylists: state.videos.featuredPlaylists.filter(
            (playlist: Playlist) => playlist.id !== action.playlistId
          ),
          allPlaylists: state.videos.allPlaylists.filter(
            (playlist: Playlist) => playlist.id !== action.playlistId
          ),
          searchedPlaylists: state.videos.searchedPlaylists.filter(
            (playlist: Playlist) => playlist.id !== action.playlistId
          )
        }
      };
    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          featureds: state.subjects.featured.filter(
            (subject: Subject) => subject.id !== action.subjectId
          )
        }
      };
    case 'DELETE_VIDEO':
      return {
        ...state,
        videos: {
          ...state.videos,
          featuredPlaylists: state.videos.featuredPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.filter(
                (video) => video.videoId !== action.videoId
              )
            })
          ),
          allPlaylists: state.videos.allPlaylists.map((playlist: Playlist) => ({
            ...playlist,
            playlist: playlist.playlist.filter(
              (video) => video.videoId !== action.videoId
            )
          })),
          searchedPlaylists: state.videos.searchedPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.filter(
                (video) => video.videoId !== action.videoId
              )
            })
          )
        }
      };
    case 'EDIT_LINK_PAGE':
      return {
        ...state,
        links: {
          ...state.links,
          byUserLinks: state.links.byUserLinks.map((link: Link) =>
            link.id === action.id
              ? {
                  ...link,
                  title: action.title,
                  content: action.content
                }
              : link
          ),
          recommendeds: state.links.recommendeds.map((link: Link) =>
            link.id === action.id
              ? {
                  ...link,
                  title: action.title,
                  content: action.content
                }
              : link
          ),
          links: state.links.links.map((link: Link) =>
            link.id === action.id
              ? {
                  ...link,
                  title: action.title,
                  content: action.content
                }
              : link
          )
        }
      };
    case 'EDIT_LINK_TITLE':
      return {
        ...state,
        links: {
          ...state.links,
          byUserLinks: state.links.byUserLinks.map((link: Link) => ({
            ...link,
            title: action.data.id === link.id ? action.data.title : link.title
          })),
          recommendeds: state.links.recommendeds.map((link: Link) => ({
            ...link,
            title: action.data.id === link.id ? action.data.title : link.title
          })),
          links: state.links.links.map((link: Link) => ({
            ...link,
            title: action.data.id === link.id ? action.data.title : link.title
          }))
        }
      };
    case 'EDIT_PLAYLIST_TITLE':
      return {
        ...state,
        videos: {
          ...state.videos,
          featuredPlaylists: state.videos.featuredPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              title:
                playlist.id === action.playlistId
                  ? action.title
                  : playlist.title
            })
          ),
          allPlaylists: state.videos.allPlaylists.map((playlist: Playlist) => ({
            ...playlist,
            title:
              playlist.id === action.playlistId ? action.title : playlist.title
          })),
          searchedPlaylists: state.videos.searchedPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              title:
                playlist.id === action.playlistId
                  ? action.title
                  : playlist.title
            })
          )
        }
      };
    case 'EDIT_VIDEO_THUMBS':
      return {
        ...state,
        videos: {
          ...state.videos,
          featuredPlaylists: state.videos.featuredPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.map((video) =>
                video.videoId === action.params.videoId
                  ? {
                      ...video,
                      video_title: action.params.title,
                      content: action.params.url
                    }
                  : video
              )
            })
          ),
          allPlaylists: state.videos.allPlaylists.map((playlist: Playlist) => ({
            ...playlist,
            playlist: playlist.playlist.map((video) =>
              video.videoId === action.params.videoId
                ? {
                    ...video,
                    video_title: action.params.title,
                    content: action.params.url
                  }
                : video
            )
          })),
          searchedPlaylists: state.videos.searchedPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.map((video) =>
                video.videoId === action.params.videoId
                  ? {
                      ...video,
                      video_title: action.params.title,
                      content: action.params.url
                    }
                  : video
              )
            })
          )
        }
      };
    case 'LIKE_LINK':
      return {
        ...state,
        links: {
          ...state.links,
          byUserLinks: state.links.byUserLinks.map((link: Link) =>
            action.id === link.id
              ? {
                  ...link,
                  likes: action.likes
                }
              : link
          ),
          recommendeds: state.links.recommendeds.map((link: Link) =>
            action.id === link.id
              ? {
                  ...link,
                  likes: action.likes
                }
              : link
          ),
          links: state.links.links.map((link: Link) =>
            action.id === link.id
              ? {
                  ...link,
                  likes: action.likes
                }
              : link
          )
        }
      };
    case 'LIKE_VIDEO':
      return {
        ...state,
        videos: {
          ...state.videos,
          allVideoThumbs: state.videos.allVideoThumbs.map(
            (video: PlaylistVideo) => {
              return video.id === action.videoId
                ? {
                    ...video,
                    likes: action.likes
                  }
                : video;
            }
          ),
          featuredPlaylists: state.videos.featuredPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.map((video) =>
                video.videoId === action.videoId
                  ? {
                      ...video,
                      likes: action.likes
                    }
                  : video
              )
            })
          ),
          allPlaylists: state.videos.allPlaylists.map((playlist: Playlist) => ({
            ...playlist,
            playlist: playlist.playlist.map((video) =>
              video.videoId === action.videoId
                ? {
                    ...video,
                    likes: action.likes
                  }
                : video
            )
          })),
          searchedPlaylists: state.videos.searchedPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.map((video) =>
                video.videoId === action.videoId
                  ? {
                      ...video,
                      likes: action.likes
                    }
                  : video
              )
            })
          )
        }
      };
    case 'LOAD_AI_CARDS':
      return {
        ...state,
        aiCards: {
          ...state.aiCards,
          cards: action.cards,
          loaded: true,
          loadMoreShown: action.loadMoreShown,
          numCards: action.numCards
        }
      };
    case 'LOAD_MORE_AI_CARDS':
      return {
        ...state,
        aiCards: {
          ...state.aiCards,
          cards: state.aiCards.cards.concat(action.cards),
          loadMoreShown: action.loadMoreShown
        }
      };
    case 'LOAD_FILTERED_AI_CARDS':
      return {
        ...state,
        aiCards: {
          ...state.aiCards,
          filteredCards: action.cards,
          filteredLoaded: true,
          filteredLoadMoreShown: action.loadMoreShown
        }
      };
    case 'LOAD_MORE_FILTERED_AI_CARDS':
      return {
        ...state,
        aiCards: {
          ...state.aiCards,
          filteredCards: state.aiCards.filteredCards.concat(action.cards),
          filteredLoadMoreShown: action.loadMoreShown
        }
      };
    case 'LOAD_LINKS':
      return {
        ...state,
        links: {
          ...state.links,
          loaded: true,
          links: action.links,
          loadMoreLinksButtonShown: action.loadMoreButton
        }
      };
    case 'LOAD_MORE_LINKS':
      return {
        ...state,
        links: {
          ...state.links,
          links: state.links.links.concat(action.links),
          loadMoreLinksButtonShown: action.loadMoreButton
        }
      };
    case 'LOAD_BY_USER_LINKS':
      return {
        ...state,
        links: {
          ...state.links,
          byUserLoaded: true,
          byUserLinks: action.links,
          loadMoreByUserLinksButtonShown: action.loadMoreButton
        }
      };
    case 'LOAD_MORE_BY_USER_LINKS':
      return {
        ...state,
        links: {
          ...state.links,
          byUserLinks: state.links.byUserLinks.concat(action.links),
          loadMoreByUserLinksButtonShown: action.loadMoreButton
        }
      };
    case 'LOAD_RECOMMENDED_LINKS':
      return {
        ...state,
        links: {
          ...state.links,
          recommendedsLoaded: true,
          recommendeds: action.recommendeds,
          loadMoreRecommendedsButtonShown: action.loadMoreButton
        }
      };
    case 'LOAD_MORE_RECOMMENDED_LINKS':
      return {
        ...state,
        links: {
          ...state.links,
          recommendeds: state.links.recommendeds.concat(action.recommendeds),
          loadMoreRecommendedsButtonShown: action.loadMoreButton
        }
      };
    case 'LOAD_FEATURED_SUBJECTS':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          featureds: action.subjects,
          featuredLoaded: true
        }
      };
    case 'LOAD_BY_USER_SUBJECTS':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          byUsers: action.subjects,
          byUsersLoadMoreButton: action.loadMoreButton,
          byUsersLoaded: true
        }
      };
    case 'LOAD_MORE_BY_USER_SUBJECTS':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          byUsers: state.subjects.byUsers.concat(action.subjects),
          byUsersLoadMoreButton: action.loadMoreButton
        }
      };
    case 'LOAD_RECOMMENDED_SUBJECTS':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          recommendeds: action.subjects,
          recommendedLoadMoreButton: action.loadMoreButton,
          recommendedLoaded: true
        }
      };
    case 'LOAD_MORE_RECOMMENDED_SUBJECTS':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          recommendeds: state.subjects.recommendeds.concat(action.subjects),
          recommendedLoadMoreButton: action.loadMoreButton
        }
      };
    case 'LOAD_CONTINUE_WATCHING':
      return {
        ...state,
        videos: {
          ...state.videos,
          continueWatchingVideos: action.videos,
          continueWatchingLoaded: true,
          loadMoreContinueWatchingButton: action.loadMoreButton,
          showingRecommendedVideos: action.showingRecommendedVideos
        }
      };
    case 'LOAD_MORE_CONTINUE_WATCHING':
      return {
        ...state,
        videos: {
          ...state.videos,
          continueWatchingVideos: state.videos.continueWatchingVideos.concat(
            action.videos
          ),
          loadMoreContinueWatchingButton: action.loadMoreButton
        }
      };
    case 'LOAD_FEATURED_PLAYLISTS':
      return {
        ...state,
        videos: {
          ...state.videos,
          featuredPlaylists: action.playlists,
          featuredPlaylistsLoaded: true
        }
      };
    case 'LOAD_PLAYLISTS':
      return {
        ...state,
        videos: {
          ...state.videos,
          allPlaylistsLoaded: true,
          allPlaylists: action.playlists,
          loadMorePlaylistsButton: action.loadMoreButton
        }
      };
    case 'LOAD_MORE_PLAYLISTS':
      return {
        ...state,
        videos: {
          ...state.videos,
          ...(action.isSearch
            ? {
                searchedPlaylists: state.videos.searchedPlaylists.concat(
                  action.playlists
                ),
                loadMoreSearchedPlaylistsButton: action.loadMoreButton
              }
            : {
                allPlaylists: state.videos.allPlaylists.concat(
                  action.playlists
                ),
                loadMorePlaylistsButton: action.loadMoreButton
              })
        }
      };
    case 'LOAD_MORE_PLAYLISTS_TO_PIN': {
      let loadMoreFeaturedPlaylistsButton = false;
      if (action.data.result.length > 10) {
        action.data.result.pop();
        loadMoreFeaturedPlaylistsButton = true;
      }
      return {
        ...state,
        videos: {
          ...state.videos,
          playlistsToPin: state.videos.playlistsToPin.concat(
            action.data.result
          ),
          loadMoreFeaturedPlaylistsButton
        }
      };
    }
    case 'LOAD_SEARCH_RESULTS':
      return {
        ...state,
        search: {
          ...state.search,
          resultObj: {
            ...state.search.resultObj,
            [action.filter]: action.results
          },
          prevSearchText: action.searchText,
          loadMoreButton: action.loadMoreButton
        }
      };
    case 'LOAD_MORE_SEARCH_RESULTS':
      return {
        ...state,
        search: {
          ...state.search,
          resultObj: {
            ...state.search.resultObj,
            [action.filter]: state.search.resultObj[action.filter].concat(
              action.results
            )
          },
          loadMoreButton: action.loadMoreButton
        }
      };
    case 'OPEN_PLAYLIST_MODAL':
      return {
        ...state,
        videos: {
          ...state.videos,
          addPlaylistModalShown: true
        }
      };
    case 'OPEN_REORDER_FEATURED_PL_MODAL':
      return {
        ...state,
        videos: {
          ...state.videos,
          reorderFeaturedPlaylistsShown: true
        }
      };
    case 'OPEN_SELECT_FEATURED_PL_MODAL': {
      let loadMoreFeaturedPlaylistsButton = false;
      if (action.data.result.length > 10) {
        action.data.result.pop();
        loadMoreFeaturedPlaylistsButton = true;
      }
      return {
        ...state,
        videos: {
          ...state.videos,
          playlistsToPin: action.data.result.map(
            (item: { title: string; id: number }) => ({
              title: item.title,
              id: item.id
            })
          ),
          loadMoreFeaturedPlaylistsButton,
          selectFeaturedPlaylistsModalShown: true
        }
      };
    }
    case 'SET_FEATURED_SUBJECTS_EXPANDED':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          featuredExpanded: action.expanded
        }
      };
    case 'SET_RECOMMENDED_SUBJECTS_EXPANDED':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          recommendedExpanded: action.expanded
        }
      };
    case 'SET_BY_USERS_EXPANDED':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          byUsersExpanded: action.expanded
        }
      };
    case 'SET_PREV_USER_ID_FOR_EXPLORE':
      return {
        ...state,
        prevUserId: action.userId
      };
    case 'SET_NAV_VIDEOS':
      return {
        ...state,
        videos: {
          ...state.videos,
          navVideos: {
            ...state.videos.navVideos,
            ...action.newState
          }
        }
      };
    case 'SET_NUM_FILTERED_CARDS':
      return {
        ...state,
        aiCards: {
          ...state.aiCards,
          numFilteredCards: action.numCards
        }
      };
    case 'SET_FILTERED_CARDS_TOTAL_BV':
      return {
        ...state,
        aiCards: {
          ...state.aiCards,
          filteredCardsTotalBv: action.totalBv
        }
      };
    case 'SET_PREV_AI_CARD_FILTERS':
      return {
        ...state,
        aiCards: {
          ...state.aiCards,
          prevFilters: action.filters
        }
      };
    case 'SET_REWARD_LEVEL':
      return {
        ...state,
        videos: {
          ...state.videos,
          featuredPlaylists: state.videos.featuredPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.map((video) =>
                video.videoId === action.videoId
                  ? {
                      ...video,
                      rewardLevel: action.rewardLevel
                    }
                  : video
              )
            })
          ),
          allPlaylists: state.videos.allPlaylists.map((playlist: Playlist) => ({
            ...playlist,
            playlist: playlist.playlist.map((video) =>
              video.videoId === action.videoId
                ? {
                    ...video,
                    rewardLevel: action.rewardLevel
                  }
                : video
            )
          })),
          searchedPlaylists: state.videos.searchedPlaylists.map(
            (playlist: Playlist) => ({
              ...playlist,
              playlist: playlist.playlist.map((video) =>
                video.videoId === action.videoId
                  ? {
                      ...video,
                      rewardLevel: action.rewardLevel
                    }
                  : video
              )
            })
          )
        }
      };
    case 'SET_SEARCHED_PLAYLISTS':
      return {
        ...state,
        videos: {
          ...state.videos,
          searchedPlaylists: action.playlists,
          loadMoreSearchedPlaylistsButton: action.loadMoreButton
        }
      };
    case 'SET_SUBJECTS_LOADED':
      return {
        ...state,
        subjects: {
          ...state.subjects,
          loaded: action.loaded
        }
      };
    case 'UPDATE_NUM_LINK_COMMENTS':
      return {
        ...state,
        links: {
          ...state.links,
          byUserLinks: state.links.byUserLinks.map((link: Link) =>
            action.id === link.id
              ? {
                  ...link,
                  numComments:
                    action.updateType === 'increase'
                      ? link.numComments + 1
                      : link.numComments - 1
                }
              : link
          ),
          recommendeds: state.links.recommendeds.map((link: Link) =>
            action.id === link.id
              ? {
                  ...link,
                  numComments:
                    action.updateType === 'increase'
                      ? link.numComments + 1
                      : link.numComments - 1
                }
              : link
          ),
          links: state.links.links.map((link: Link) =>
            action.id === link.id
              ? {
                  ...link,
                  numComments:
                    action.updateType === 'increase'
                      ? link.numComments + 1
                      : link.numComments - 1
                }
              : link
          )
        }
      };
    case 'UPLOAD_LINK':
      return {
        ...state,
        links: {
          ...state.links,
          links: [
            {
              id: action.linkItem.contentId,
              content: action.linkItem.content,
              likes: [],
              timeStamp: action.linkItem.lastInteraction,
              title: action.linkItem.title,
              uploader: action.linkItem.uploader
            }
          ].concat(state.links.links)
        }
      };
    case 'UPLOAD_PLAYLIST':
      return {
        ...state,
        videos: {
          ...state.videos,
          allPlaylists: [action.data].concat(state.videos.allPlaylists),
          loadMoreButton: state.loadMoreButton,
          addPlaylistModalShown: false
        }
      };
    default:
      return state;
  }
}
