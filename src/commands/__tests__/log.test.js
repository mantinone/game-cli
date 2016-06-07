/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

describe(testContext(__filename), function () {
  describe('invoke', function () {
    before(function () {
      this.invoke = require('../log').invoke
      this.notify = msg => {
        this.notifications.push(msg)
      }
      this.argv = ['-r1', 'some1:25', 'some2:25', 'some3:25', 'some4:25']
      this.lgJWT = 'not.a.real.token'
      this.lgPlayer = {id: 'not.a.real.id'}
    })
    beforeEach(function () {
      this.notifications = []
    })

    it('notifies with the usage message when requested', function () {
      const {lgJWT, lgPlayer} = this
      return this.invoke(['-h'], this.notify, {lgJWT, lgPlayer})
        .then(() => {
          expect(this.notifications[0]).to.match(/Usage:/)
        })
    })

    it('notifies with a usage hint when not logging reflections', function () {
      const {lgJWT, lgPlayer} = this
      return this.invoke([], this.notify, {lgJWT, lgPlayer})
        .then(() => {
          expect(this.notifications[0]).to.match(/\-\-help/)
        })
    })

    // TODO: enable this test once APIs are ready
    it('notifies that the retrospective survey being loaded when requested' /* , function () {
      // nock('https://game.learnersguild.test')
      //   .post('/graphql')
      //   .reply(200, {data: {createdIds: ['00000000-1111-2222-3333-444444444444']}})

      const {lgJWT, lgPlayer} = this
      this.invoke(['-r'], this.notify, {lgJWT, lgPlayer})
      expect(this.notifications[0]).to.match(/loading.+retrospective/i)
    } */)

    // TODO: enable this test once APIs are ready
    it('notifies that the retrospective question is being loaded when requested' /* , function () {
      // nock('https://game.learnersguild.test')
      //   .post('/graphql')
      //   .reply(200, {data: {createdIds: ['00000000-1111-2222-3333-444444444444']}})

      const {lgJWT, lgPlayer} = this
      this.invoke(['-r1'], this.notify, {lgJWT, lgPlayer})
      expect(this.notifications[0]).to.match(/loading.+question.+1/i)
    } */)

    it('notifies with a usage hint when two questions are attempted at once', function () {
      const {lgJWT, lgPlayer} = this
      this.invoke(['-r1', 'answer1', '-r2', 'answer2'], this.notify, {lgJWT, lgPlayer})
        .then(() => {
          expect(this.notifications[0]).to.match(/\-\-help/)
        })
    })

    it('notifies with an error message when invoked by a non-player', function () {
      const {lgJWT} = this
      return Promise.all([
        this.invoke(this.argv, this.notify, {lgJWT, lgPlayer: null})
          .then(() => {
            expect(this.notifications[0]).to.match(/not a player/)
          }),
        this.invoke(this.argv, this.notify, {lgJWT, lgPlayer: {object: 'without id attribute'}})
          .then(() => {
            expect(this.notifications[1]).to.match(/not a player/)
          })
      ])
    })

    it('notifies that the reflection is being logged', function () {
      nock('https://game.learnersguild.test')
        .post('/graphql')
        .reply(200, {data: {createdIds: ['00000000-1111-2222-3333-444444444444']}})

      const {lgJWT, lgPlayer} = this
      this.invoke(this.argv, this.notify, {lgJWT, lgPlayer})
      expect(this.notifications[0]).to.match(/logging.+reflection/i)
    })

    it('does not notify if the API invocation succeeds', function (done) {
      nock('https://game.learnersguild.test')
        .post('/graphql')
        .reply(200, {data: {createdIds: ['00000000-1111-2222-3333-444444444444']}})

      const {lgJWT, lgPlayer} = this
      return this.invoke(['-r1', 'answer'], this.notify, {lgJWT, lgPlayer})
        .then(() => {
          expect(this.notifications.length).to.equal(1)
          done()
        })
        .catch(error => done(error))
    })

    it('notifies of API invocation errors', function (done) {
      nock('https://game.learnersguild.test')
        .post('/graphql')
        .reply(500, 'Internal Server Error')

      const {lgJWT, lgPlayer} = this
      return this.invoke(['-r', '99999999', 'answer'], this.notify, {lgJWT, lgPlayer})
        .then(() => {
          expect(this.notifications[1]).to.match(/API invocation failed/)
          done()
        })
        .catch(error => done(error))
    })
  })
})
