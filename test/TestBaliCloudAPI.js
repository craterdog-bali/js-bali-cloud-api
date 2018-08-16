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
var bali = require('bali-document-notation/BaliDocuments');
var notary = require('bali-digital-notary/BaliNotary');
var mocha = require('mocha');
var expect = require('chai').expect;

describe('Bali Cloud API™', function() {
    var consumerAPI;
    var merchantAPI;
    var source =
        '[\n' +
        '    $foo: "bar"\n' +
        ']\n';

    describe('Initialize Environment', function() {
        var repository;
        var consumerKey;
        var consumerCert;
        var merchantKey;
        var merchantCert;

        it('should setup a local repository', function() {
            repository = new LocalRepository('test/repository');
            expect(repository).to.exist;  // jshint ignore:line
        });

        it('should generate notary key for consumer', function() {
            var keypair = notary.generateKeys('v1');
            consumerKey = keypair.notaryKey;
            consumerAPI = new BaliCloudAPI(consumerKey, repository);
            expect(consumerAPI).to.exist;  // jshint ignore:line
            consumerCert = keypair.certificate;
        });

        it('should generate notary key for merchant', function() {
            var keypair = notary.generateKeys('v1');
            merchantKey = keypair.notaryKey;
            merchantAPI = new BaliCloudAPI(merchantKey, repository);
            expect(merchantAPI).to.exist;  // jshint ignore:line
            merchantCert = keypair.certificate;
        });

        it('should publish notary certificate for consumer', function() {
            consumerAPI.publishCertificate(consumerCert);
            var certificate = merchantAPI.retrieveCertificate(consumerKey.citation);
            expect(certificate).to.exist;  // jshint ignore:line
            expect(certificate.toString()).to.equal(consumerCert.toString());
        });

        it('should publish notary certificate for merchant', function() {
            merchantAPI.publishCertificate(merchantCert);
            certificate = consumerAPI.retrieveCertificate(merchantKey.citation);
            expect(certificate).to.exist;  // jshint ignore:line
            expect(certificate.toString()).to.equal(merchantCert.toString());
        });

    });

    describe('Test Drafts', function() {
        var tag = bali.tag();
        var version = 'v1.2';
        var draft = bali.parseDocument(source);

        it('should save a new draft document in the repository', function() {
            console.log('        initial draft v1.2: ' + draft);
            consumerAPI.saveDraft(tag, version, draft);
        });

        it('should retrieve the new draft document from the repository', function() {
            draft = consumerAPI.retrieveDraft(tag, version);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.equal(source);
        });

        it('should save an updated draft document in the repository', function() {
            bali.setValueForKey(draft, '$bar', '"baz"');
            console.log('        updated draft v1.2: ' + draft);
            consumerAPI.saveDraft(tag, version, draft);
            expect(draft.toString()).to.not.equal(source);
        });

        it('should discard the draft document in the repository', function() {
            consumerAPI.discardDraft(tag, version);
        });

        it('should verify that the draft document no longer exists in the repository', function() {
            draft = consumerAPI.retrieveDraft(tag, version);
            expect(draft).to.not.exist;  // jshint ignore:line
        });

    });

    describe('Test Documents', function() {
        var tag = bali.tag();
        var version = 'v2.3.4';
        var newVersion = 'v2.4';
        var draft;
        var document;
        var citation;
        var newCitation;

        it('should commit a draft of a new document to the repository', function() {
            document = bali.parseDocument(source);
            citation = consumerAPI.commitDocument(tag, version, document);
        });

        it('should retrieve the committed document from the repository', function() {
            document = consumerAPI.retrieveDocument(citation);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.not.equal(source);
            console.log('        committed document v2.3.4: ' + document);
        });

        it('should checkout a draft of the new document from the repository', function() {
            draft = consumerAPI.checkoutDocument(citation, newVersion);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.not.equal(document.toString());
            console.log('        draft v2.4: ' + draft);
        });

        it('should commit an updated version of the document to the repository', function() {
            bali.setValueForKey(draft, '$bar', '"baz"');
            console.log('        updated draft v1.2: ' + draft);
            newCitation = consumerAPI.commitDocument(tag, newVersion, draft);
            expect(newCitation).to.not.equal(citation);
        });

        it('should retrieve the updated committed document from the repository', function() {
            document = consumerAPI.retrieveDocument(newCitation);
            expect(document).to.exist;  // jshint ignore:line
            console.log('        committed document v2.4: ' + document);
        });

        it('should checkout the latest version of the document from the repository', function() {
            newVersion = 'v2.4.1';
            draft = consumerAPI.checkoutDocument(newCitation, newVersion);
            console.log('        draft v2.4.1: ' + draft);
        });

        it('should discard the draft document in the repository', function() {
            consumerAPI.discardDraft(tag, newVersion);
        });

        it('should verify that the draft document no longer exists in the repository', function() {
            draft = consumerAPI.retrieveDraft(tag, newVersion);
            expect(draft).to.not.exist;  // jshint ignore:line
        });

        it('should make sure the new document still exists in the repository', function() {
            document = consumerAPI.retrieveDocument(newCitation);
            expect(document).to.exist;  // jshint ignore:line
            console.log('        committed document v2.4: ' + document);
        });

    });

    describe('Test Messages', function() {
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

    describe('Test Events', function() {

    });

});
