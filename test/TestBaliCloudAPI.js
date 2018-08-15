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

var repository;
var consumerAPI;
var merchantAPI;

var source =
        '[\n' +
        '    $foo: "bar"\n' +
        ']\n';

describe('Bali Cloud API™', function() {

    describe('Test BaliCloudAPI', function() {

        it('should generate notary keys and publish their certificates', function() {
            // setup the global repository
            repository = new LocalRepository('test/repository');

            // setup the consumer API
            var keypair = notary.generateKeys('v1');
            var consumerKey = keypair.notaryKey;
            var consumerCert = keypair.certificate;
            console.log('        consumer certificate: ' + consumerCert);
            consumerAPI = new BaliCloudAPI(consumerKey, repository);
            consumerAPI.publishCertificate(consumerCert);

            // setup the merchant API
            keypair = notary.generateKeys('v1');
            var merchantKey = keypair.notaryKey;
            var merchantCert = keypair.certificate;
            console.log('        merchant certificate: ' + merchantCert);
            merchantAPI = new BaliCloudAPI(merchantKey, repository);
            merchantAPI.publishCertificate(merchantCert);
        });

        it('should perform a document lifecycle', function() {
            var tag = bali.tag();
            var version = 'v2.3.4';
            var draft = bali.parseDocument(source);
            console.log('        initial draft v2.3.4: ' + draft);

            // save a new draft document in the repository
            consumerAPI.saveDraft(tag, version, draft);

            // retrieve the new draft document from the repository
            draft = consumerAPI.retrieveDraft(tag, version);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.equal(source);

            // update the body of the draft document
            bali.setValueForKey(draft, '$bar', '"baz"');
            console.log('        updated draft v2.3.4: ' + draft);

            // commit the new draft to the repository
            var citation = consumerAPI.commitDocument(tag, version, draft);

            // retrieve the committed document from the repository
            var document = consumerAPI.retrieveDocument(citation);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.not.equal(source);
            console.log('        committed document v2.3.4: ' + document);

            // checkout a draft of the new document from the repository
            var newVersion = 'v2.4';
            draft = consumerAPI.checkoutDocument(citation, newVersion);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.not.equal(source);
            console.log('        draft v2.4: ' + draft);

            // commit a document that has been notarized by two parties
            notary.notarizeDocument(consumerAPI.notaryKey, tag, newVersion, draft);
            citation = merchantAPI.commitDocument(tag, newVersion, draft);

            // retrieve the new committed document from the repository
            document = consumerAPI.retrieveDocument(citation);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.not.equal(source);
            console.log('        committed document v2.4: ' + document);

            // checkout the latest version
            newVersion = 'v2.4.1';
            draft = consumerAPI.checkoutDocument(citation, newVersion);
            console.log('        draft v2.4.1: ' + draft);

            // delete the latest draft from the repository
            consumerAPI.discardDraft(tag, newVersion);

            // make sure the draft no longer exists in the repository
            draft = consumerAPI.retrieveDraft(tag, newVersion);
            expect(draft).not.to.exist;  // jshint ignore:line

            // make sure the new document still exists in the repository
            document = consumerAPI.retrieveDocument(citation);
            expect(document).to.exist;  // jshint ignore:line
            console.log('        committed document v2.4: ' + document);
        });

        it('should perform a message lifecycle', function() {
            var queueId = 'queueId';

            // make sure the message queue is empty
            var message = consumerAPI.receiveMessage(queueId);
            expect(message).to.not.exist;  // jshint ignore:line

            // queue up some messages
            for (var i = 0; i < 3; i++) {
                // place a new message on the queue
                message = bali.parseDocument(source);
                consumerAPI.queueMessage(queueId, message);

                // attempt to place the same message on the queue
                //expect(consumerAPI.queueMessage.bind(consumerAPI, queueId, message)).to.throw();
                //consumerAPI.queueMessage(queueId, message);
            }

            // retrieve the messages
            for (var j = 0; j < 3; j++) {
                // retrieve a message from the queue
                message = merchantAPI.receiveMessage(queueId);
                expect(message).to.exist;  // jshint ignore:line
            }

            // make sure the message queue is empty
            message = merchantAPI.receiveMessage(queueId);
            expect(message).to.not.exist;  // jshint ignore:line
        });

    });

});
