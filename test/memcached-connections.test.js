//global it

'use strict';

/**
 * Test dependencies
 */

var assert = require('assert')
  , fs = require('fs')
  , common = require('./common')
  , Memcached = require('../');
  
var Mock = require('./mock.js'); 

global.testnumbers = global.testnumbers || +(Math.random(10) * 1000000).toFixed();

/**
 * Test connection issues
 */
describe('Memcached connections', function () {
  it('should call the callback only once if theres an error', function (done) {
    var memcached = new Memcached('127.0.1:1234', {autodiscovery:false, update_time: 1000}, {timeout:10000, retries: 3 }, new Mock(common.servers.single))
      , calls = 0;

    this.timeout(60000);

    memcached.get('idontcare', function (err) {
      calls++;

      // it should only be called once
      assert.equal(calls, 1);

      memcached.end();
      done();
    });
  });
  it('should remove a failed server', function(done) {
    var memcached = new Memcached('127.0.1:1234', {autodiscovery:false, update_time: 1000}, {
      timeout: 1000,
      retries: 0,
      failures: 0,
      retry: 100,
      remove: true }, new Mock('127.0.1:1234'));
    this.timeout(60000);

    memcached.get('idontcare', function (err) {
        function noserver() {
          memcached.get('idontcare', function(err) {
              throw err;
          });
        };
        assert.throws(noserver, new RegExp('Server at 127.0.1.1234 not available'));
        memcached.end();
        done();
    });
  });
  it('should rebalance to remaining healthy server', function(done) {
    var memcached = new Memcached(['127.0.1:1234', common.servers.single], {autodiscovery:false, update_time: 1000}, {
      timeout: 1000,
      retries: 0,
      failures: 0,
      retry: 100,
      remove: true,
      redundancy: true }, new Mock(['127.0.1:1234', common.servers.single]));
      
    this.timeout(60000);

    // 'a' goes to fake server. first request will cause server to be removed
    memcached.get('a', function (err) {
      // second request should be rebalanced to healthy server
      memcached.get('a', function (err) {
        assert.ifError(err);
        memcached.end();
        done();
      });
    });
  });
});
