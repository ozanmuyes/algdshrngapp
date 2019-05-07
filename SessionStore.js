'use strict';

const session = require('express-session');

const noop = () => {};

class SessionStore extends session.Store {
  constructor(db) {
    super();

    this._db = db;
  }

  // #region Required
  destroy(sid, cb = noop) {
    console.log(`"destroy" on ${sid}...`);

    this._db.get('sessions')
      .remove({ id: sid })
      .write();

    cb(null);
  }

  get(sid, cb) {
    console.log(`"get" on ${sid}...`);

    const session = this._db.get('sessions')
      .find({ id: sid })
      .value();

    cb(null, session);
  }

  set(sid, session, cb = noop) {
    console.log(`"set" ${sid} to ${session}`);

    this._db.get('sessions')
      .upsert(Object.assign({}, { id: sid }, session))
      .write();

    cb(null);
  }
  // #endregion Required
}

module.exports = SessionStore;
