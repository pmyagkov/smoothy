import EventEmitter from '../../node_modules/eventemitter2/index'

const SOCKET_URL = "ws://smoothy.puelle.me/ws";

class WebSocketClient extends EventEmitter {
  constructor () {
    super();

    this._clientId = null;

    this._initConnection();
  }

  _initConnection () {
    let socket = this._socket = new WebSocket(SOCKET_URL);

    socket.onopen = (...args) => this._onOpen(...args);
    socket.onclose = (...args) => this._onClose(...args);
    socket.onmessage = (...args) => this._onMessage(...args);
    socket.onerror = (...args) => this._onError(...args);
  }

  _onOpen () {
    console.log(`Connection established`);
  }

  _onClose (evt) {
    if (evt.wasClean) {
      console.log(`Connection closed`);
    } else {
      console.log(`Connection was interrupted`); // например, "убит" процесс сервера
    }
    console.log(`Code: ${evt.code}, reason ${evt.reason}`);

    this._initConnection();
  }

  _onMessage (evt) {
    let message = JSON.parse(evt.data);

    console.log(`Message '${message.type}' received with data`, message.data);

    switch (message.type) {
      case 'launch':
      case 'start':
      case 'pause':
      case 'stop':
      case 'correct':
      case 'play':
        this.emit(message.type, message.data);
        break;

      case 'greetings':
        if (!this._clientId) {
          this._clientId = message.data.clientId;
        }

        this._socket.send(this._prepareRequest('greetings', { clientId: this._clientId }));

        break;
    }
  }

  _onError (error) {
    console.log(`Error '${error.message}'`);
  }

  _prepareRequest (command, data = {}) {
    return JSON.stringify({
      command, data: Object.assign(data, { clientId: this._clientId })
    });
  }

  launch (url) {
    console.log(`Sending WS 'launch' command`, url);

    this._socket.send(this._prepareRequest('launch', { url }));
  }

  play () {
    console.log(`Sending WS 'play' command`);

    this._socket.send(this._prepareRequest('play'));
  }

  pause () {
    console.log(`Sending WS 'pause' command`);

    this._socket.send(this._prepareRequest('pause'));
  }

  ready () {
    console.log(`Sending WS 'ready' command`);

    this._socket.send(this._prepareRequest('ready'));
  }

  sendTime (time) {
    console.log(`Sending WS 'time' command`, time);

    let match = /(\d+):(\d+)(?:(\d+))?/.exec(time);
    if (!match) {
      return console.warn(`Can't recognize playback time '${time}'`);
    }

    const withHours = !!match[3];
    time = withHours ?
      3600 * Number(match[1]) + 60 * Number(match[2]) + Number(match[3]) :
      60 * Number(match[1]) + Number(match[2]);

    console.log(`Translated time '${time}'s`);

    this._socket.send(this._prepareRequest('time', { time }));
  }

  quit () {
    this._socket.send(this._prepareRequest('quit'));
  }

}

export default WebSocketClient
