/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

var BaliCloudAPI = require('../BaliCloudAPI').BaliCloudAPI;
var LocalRepository = require('../LocalRepository').LocalRepository;
var bali = require('bali-language/BaliLanguage');
var notary = require('bali-digital-notary/BaliNotary');
var mocha = require('mocha');
var expect = require('chai').expect;

var keypair;
var notaryKey;
var certificate;
var repository;
var api;

var source =
        '[\n' +
        '    $foo: "bar"\n' +
        ']\n';

describe('Bali Cloud API™', function() {

    describe('Test BaliCloudAPI', function() {

        it('should generate a notary key and publish its certificate', function() {
            keypair = notary.generateKeys('v1');
            notaryKey = keypair.notaryKey;
            certificate = keypair.certificate;
            repository = new LocalRepository('test/repository');
            api = new BaliCloudAPI(notaryKey, repository);
            api.publishCertificate(certificate);
        });

        it('should perform a document lifecycle', function() {
            var tag = bali.tag().toString();
            var version = 'v2.3.4';
            var draft = bali.parseDocument(source);

            // save a new draft document in the repository
            api.saveDraft(tag, version, draft);

            // retrieve the new draft document from the repository
            draft = api.retrieveDraft(tag, version);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.equal(source);

            // update the body of the draft document
            var body = bali.getBody(draft);
            bali.setValueForKey(body, '$bar', '"baz"');

            // commit the new draft to the repository
            var citation = api.commitDocument(tag, version, draft);

            // retrieve the new document from the repository
            var document = api.retrieveDocument(citation);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.not.equal(source);

            // checkout a draft of the new document from the repository
            newVersion = 'v2.4';
            draft = api.checkoutDocument(citation, newVersion);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.not.equal(source);

            // delete the new draft from the repository
            api.discardDraft(tag, newVersion);

            // make sure the draft no longer exists in the repository
            draft = api.retrieveDraft(tag, newVersion);
            expect(draft).not.to.exist;  // jshint ignore:line

            // make sure the new document still exists in the repository
            document = api.retrieveDocument(citation);
            expect(document).to.exist;  // jshint ignore:line
        });

/*
        it('should perform a message lifecycle', function() {
            var queueId = 'queueId';

            // make sure the message queue is empty
            var message = api.dequeueMessage(queueId);
            expect(message).to.not.exist;  // jshint ignore:line

            // queue up some messages
            for (var i = 0; i < 3; i++) {
                // place a new message on the queue
                var messageId = 'messageId' + i;
                api.queueMessage(queueId, messageId, source);

                // attempt to place the same message on the queue
                expect(api.queueMessage.bind(api, queueId, messageId, source)).to.throw();
            }

            // dequeue the messages
            for (var j = 0; j < 3; j++) {
                // retrieve a message from the queue
                message = api.dequeueMessage(queueId);
                expect(message).to.equal(source);
            }

            // make sure the message queue is empty
            message = api.dequeueMessage(queueId);
            expect(message).to.not.exist;  // jshint ignore:line
        });
*/

    });

});
