
Gun.log.off = true;
var MAX_PEER_LIST_SIZE = 10;
var MAX_CONNECTED_PEERS = 4;
var peers = getPeers();
var randomPeers = _.sample(
  Object.keys(
    _.pick(peers, p => { return p.enabled; })
  ), MAX_CONNECTED_PEERS
);
var gun = Gun({ peers: randomPeers });
window.gun = gun;

function checkGunPeerCount() {
  var peersFromGun = gun.back('opt.peers');
  var connectedPeers = _.filter(Object.values(peersFromGun), (peer) => {
    return peer && peer.wire && peer.wire.hied === 'hi';
  });
  if (connectedPeers.length < MAX_CONNECTED_PEERS) {
    var unconnectedPeers = _.filter(Object.keys(peers), url => {
      var addedToGun = _.pluck(Object.values(peersFromGun), 'url').indexOf(url) > -1;
      var enabled = peers[url].enabled;

      
      return enabled && !addedToGun;
    });
    if (unconnectedPeers.length) {
      connectPeer(_.sample(unconnectedPeers));
    }
  }
  if (connectedPeers.length > MAX_CONNECTED_PEERS) {
    disconnectPeer(_.sample(connectedPeers));
    console.log('removed peer');
  }
}
setInterval(checkGunPeerCount, 2000);

var notificationSound = new Audio('./notification.mp3');
var chat = gun.get('converse/' + location.hash.slice(1));
var chats = {};
var autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});
var activeChat;
var activeProfile;
var onlineTimeout;
var loginTime;
var key;
var latestChatLink;
var desktopNotificationsEnabled;
var areWeOnline;
var unseenTotal;

var localStorageKey = localStorage.getItem('chatKeyPair');
if (localStorageKey) {
  console.log('user back');
  login(JSON.parse(localStorageKey));
} else {
  console.log('new user')
}


function getPeers() {
  var p = localStorage.getItem('gunPeers');
  if (p && p !== 'undefined') {
    p = JSON.parse(p);
  } else {
    p = {
      'https://gun-us.herokuapp.com/gun': {},
      'https://gun-eu.herokuapp.com/gun': {},
      'https://gunjs.herokuapp.com/gun': {}
    };
  }
  if (iris.util.isElectron) {
    p['http://localhost:8767/gun'] = {};
  }
  Object.keys(p).forEach(k => _.defaults(p[k], {enabled: true}));
  return p;
}

function resetPeers() {
  localStorage.setItem('gunPeers', undefined);
  peers = getPeers();
}

function savePeers() {
  localStorage.setItem('gunPeers', JSON.stringify(peers));
}

function connectPeer(url) {
  if (peers[url]) {
    peers[url].enabled = true;
    gun.opt({peers: [url]});
    savePeers();
  } else {
    addPeer({url});
  }
}

function disablePeer(url, peerFromGun) {
  peers[url].enabled = false;
  if (peerFromGun) {
    disconnectPeer(peerFromGun);
  }
  savePeers();
}

function disconnectPeer(peerFromGun) {
  gun.on('bye', peerFromGun);
  peerFromGun.url = '';
}

async function addPeer(peer) {
  if (!isUrl(peer.url)) {
    throw new Error('Invalid url', peer.url);
  }
  peers[peer.url] = peers[peer.url] || _.omit(peer, 'url');
  if (peer.visibility === 'public') {
    // rolling some crypto operations to obfuscate actual url in case we want to remove it
    var secret = await Gun.SEA.secret(key.epub, key);
    var encryptedUrl = await Gun.SEA.encrypt(peer.url, secret);
    var encryptedUrlHash = await Gun.SEA.work(encryptedUrl, null, null, {name: 'SHA-256'});
    gun.user().get('peers').get(encryptedUrlHash).put({url: peer.url, lastSeen: new Date().toISOString()});
  }
  if (peer.enabled !== false) {
    connectPeer(peer.url);
  } else {
    savePeers();
  }
}

 function newUserLogin(name) {
      Gun.SEA.pair().then( async k => {
          login(k)
         gun.user().get('profile').get('name').put(name);
        console.log(k);
        let url = await createChatLink(k);
        console.log(url);
        return url
      });
}

async function createChatLink(key) {
  latestChatLink = await iris.Chat.createChatLink(gun, key);
  return latestChatLink
}

function login(k) {
  chats = {};
  key = k;
  localStorage.setItem('chatKeyPair', JSON.stringify(k));
  iris.Chat.initUser(gun, key)
  loginTime = new Date();
  setOurOnlineStatus();
  iris.Chat.getChats(gun, key, addChat)
}


function addChat(pub, chatLink) {
  if (!pub || Object.prototype.hasOwnProperty.call(chats, pub)) {
    return;
  }

  chats[pub] = new iris.Chat({gun, key, chatLink : chatLink, participants : pub, onMessage: (msg, info) => {
    console.log('info')
    msg.selfAuthored = info.selfAuthored;
    chats[pub].messages[msg.time] = msg;
    msg.time = new Date(msg.time)
    if (!info.selfAuthored && msg.time > (chats[pub].myLastSeenTime || -Infinity)) {
      if (activeChat !== pub || document.visibilityState !== 'visible') {
        changeChatUnseenCount(pub, 1);
      }
    }
    if (!info.selfAuthored && msg.time > chats[pub].theirLastSeenTime) {
      chats[pub].theirLastSeenTime = msg.time;
      lastSeenTimeChanged(pub);
    }
    if (!chats[pub].latest || msg.time > chats[pub].latest.time) {
      chats[pub].latest = msg;
      var text = truncateString(msg.text, 100);
      var now = new Date();
      ing(msg.text, 100);
      var now = new Date();
      var latestTimeText = iris.util.getDaySeparatorText(msg.time, msg.time.toLocaleDateString({dateStyle:'short'}));
  }

  var askForPeers = _.once(() => {
    _.defer(() => {
      gun.user(pub).get('peers').once().map().on(peer => {
        if (peer && peer.url) {
          var peerCountBySource = _.countBy(peers, p => p.from);
          var peerSourceCount = Object.keys(peerCountBySource).length;
          if (!peerCountBySource[pub]) {
            peerSourceCount += 1;
          }
          var maxPeersFromSource = MAX_PEER_LIST_SIZE / peerSourceCount;
          addPeer({url: peer.url, connect: true, from: pub});
          while (Object.keys(peers).length > MAX_PEER_LIST_SIZE) {
            _.each(Object.keys(peerCountBySource), source => {
              if (peerCountBySource[source] > maxPeersFromSource) {
                delete peers[_.sample(Object.keys(peers))];
                peerCountBySource[source] -= 1;
              }
            });
          }
        }
      });
    });
  })
  chats[pub].getMyMsgsLastSeenTime(time => {
    chats[pub].myLastSeenTime = new Date(time);
    if (chats[pub].latest && chats[pub].myLastSeenTime >= chats[pub].latest.time) {
      changeChatUnseenCount(pub, 0);
    }
    askForPeers();
  });
  chats[pub].online = {};
  iris.Chat.getOnline(gun, pub, (online) => {
    if (chats[pub]) {
      chats[pub].online = online;
      setTheirOnlineStatus(pub);
      setDeliveredCheckmarks(pub);
    }
  });
}})}




function setOurOnlineStatus() {
  iris.Chat.setOnline(gun, areWeOnline = true);
  document.addEventListener("mousemove", () => {
    if (!areWeOnline && activeChat) {
      chats[activeChat].setMyMsgsLastSeenTime();
    }
    iris.Chat.setOnline(gun, areWeOnline = true);
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => iris.Chat.setOnline(gun, areWeOnline = false), 60000);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      iris.Chat.setOnline(gun, areWeOnline = true);
      if (activeChat) {
        chats[activeChat].setMyMsgsLastSeenTime();
        changeChatUnseenCount(activeChat, 0);
      }
    } else {
      iris.Chat.setOnline(gun, areWeOnline = false);
    }
  });
}

export {
  newUserLogin,
  login
}

// function login(k) {
//   chats = {};
//   key = k;
//   localStorage.setItem('chatKeyPair', JSON.stringify(k));
//   iris.Chat.initUser(gun, key);
//   $('#my-chat-links').empty();
//   iris.Chat.getMyChatLinks(gun, key, undefined, chatLink => {
//     var row = $('<div>').addClass('flex-row');
//     var text = $('<div>').addClass('flex-cell').text(chatLink.url);
//     var btn = $('<button>Remove</button>').click(() => {
//       iris.Chat.removeChatLink(gun, key, chatLink.id);
//       hideAndRemove(row);
//     });
//     row.append(text);
//     row.append($('<div>').addClass('flex-cell no-flex').append(btn));
//     $('#my-chat-links').append(row);
//     setChatLinkQrCode(chatLink.url);
//     latestChatLink = chatLink.url;
//   });
//   $('#generate-chat-link').off().on('click', createChatLink);
//   myIdenticon = getIdenticon(key.pub, 40);
//   loginTime = new Date();
//   unseenTotal = 0;
//   $(".chat-item:not(.new)").remove();
//   $("#my-identicon").empty();
//   $("#my-identicon").append(myIdenticon);
//   $(".user-info").off().on('click', showSettings);
//   $(".profile-link").attr('href', getUserChatLink(key.pub)).off().on('click', e => {
//     e.preventDefault();
//     if (chats[key.pub]) {
//       showProfile(key.pub);
//     }
//   });
//   setOurOnlineStatus();
//   iris.Chat.getChats(gun, key, addChat);
//   var chatWith = getUrlParameter('chatWith');
//   if (chatWith) {
//     addChat(chatWith, window.location.href);
//     showChat(chatWith);
//     window.history.pushState({}, "Iris Chat", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]); // remove param
//   } else {
//     if (iris.util.isMobile) {
//       showMenu();
//     } else {
//       showNewChat();
//     }
//   }
//   $('.user-info .user-name').text('anonymous');
//   $('#settings-name').val('');
//   $('#current-profile-photo').attr('src', '');
//   $('#private-key-qr').remove();
//   gun.user().get('profile').get('name').on(name => {
//     if (name && typeof name === 'string') {
//       $('.user-info .user-name').text(truncateString(name, 20));
//       var el = $('#settings-name');
//       if (!el.is(':focus')) {
//         $('#settings-name').val(name);
//       }
//     }
//   });
//   gun.user().get('profile').get('photo').on(data => {
//     $('#current-profile-photo').attr('src', data);
//     $('#add-profile-photo').toggleClass('hidden', true);
//   });
//   setChatLinkQrCode();
//   if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
//     setTimeout(() => {
//       $('#enable-notifications-prompt').slideDown();
//     }, 5000);
//   }
// }

// function setTheirOnlineStatus(pub) {
//   var online = chats[pub].online;
//   if (online && (activeChat === pub || activeProfile === pub)) {
//     if (online.isOnline) {
//       $('#header-content .last-seen').text('online');
//     } else if (online.lastActive) {
//       var d = new Date(online.lastActive);
//       var lastSeenText = iris.util.getDaySeparatorText(d, d.toLocaleDateString({dateStyle:'short'}));
//       if (lastSeenText === 'today') {
//         lastSeenText = iris.util.formatTime(d);
//       } else {
//         lastSeenText = iris.util.formatDate(d);
//       }
//       $('#header-content .last-seen').text('last active ' + lastSeenText);
//     }
//   }
// }
// function showChat(pub) {
//   if (!pub) {
//     return;
//   }
//   resetView();
//   activeChat = pub;
//   if (!Object.prototype.hasOwnProperty.call(chats, pub)) {
//     addChat(pub);
//   }
//   var chatListEl = $('.chat-item[data-pub="' + pub +'"]');
//   chatListEl.toggleClass('active', true);
//   chatListEl.find('.unseen').empty().hide();
//   $("#message-list").empty();
//   $("#message-view").show();
//   $(".message-form").show();
//   if (!iris.util.isMobile) {
//     $("#new-msg").focus();
//   }
//   $('#new-msg').off().on('input', () => {
//     chats[pub].setTyping($('#new-msg').val().length > 0);
//   });
//   $(".message-form form").off().on('submit', event => {
//     event.preventDefault();
//     var text = $('#new-msg').val();
//     if (!text.length) { return; }
//     chats[pub].setTyping(false);
//     chats[pub].send(text);
//     $('#new-msg').val('');
//   });
//   changeChatUnseenCount(pub, 0);
//   addUserToHeader(pub);
//   var msgs = Object.values(chats[pub].messages);
//   msgs.forEach(addMessage);
//   sortMessagesByTime();
//   $('#message-view').scroll(() => {
//     var scrollPosition = $('#message-view').scrollTop();
//     var currentDaySeparator = $('.day-separator').last();
//     var pos = currentDaySeparator.position();
//     while (currentDaySeparator && pos && pos.top - 55 > 0) {
//       currentDaySeparator = currentDaySeparator.prevAll('.day-separator').first();
//       pos = currentDaySeparator.position();
//     }
//     var s = currentDaySeparator.clone();
//     var center = $('<div>').css({position: 'fixed', top: 70, 'text-align': 'center'}).attr('id', 'floating-day-separator').width($('#message-view').width()).append(s);
//     $('#floating-day-separator').remove();
//     setTimeout(() => s.fadeOut(), 2000);
//     $('#message-view').prepend(center);
//   });
//   lastSeenTimeChanged(pub);
//   chats[pub].setMyMsgsLastSeenTime();
//   $('#message-view').scrollTop($('#message-view')[0].scrollHeight - $('#message-view')[0].clientHeight);
//   chats[pub].setMyMsgsLastSeenTime();
//   setTheirOnlineStatus(pub);
//   setDeliveredCheckmarks(pub);
// }

