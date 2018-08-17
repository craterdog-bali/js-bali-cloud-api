/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

var BaliAPI = require('../BaliAPI').BaliAPI;
var LocalRepository = require('../LocalRepository').LocalRepository;
var bali = require('bali-document-notation/BaliDocuments');
var notary = require('bali-digital-notary/BaliNotary');
var mocha = require('mocha');
var expect = require('chai').expect;

describe('Bali Cloud API™', function() {
    var consumerClient;
    var consumerKey;
    var consumerCert;
    var merchantClient;
    var merchantKey;
    var merchantCert;
    var source =
        '[\n' +
        '    $foo: "bar"\n' +
        ']\n';

    describe('Initialize Environment', function() {
        var repository;

        it('should setup the local repository', function() {
            repository = new LocalRepository('test/repository');
            expect(repository).to.exist;  // jshint ignore:line
        });

        it('should setup the client environment for the merchant', function() {
            consumerClient = BaliAPI.loadClient('consumer', repository);
            expect(consumerClient).to.exist;  // jshint ignore:line
            consumerKey = consumerClient.notaryKey;
            expect(consumerKey).to.exist;  // jshint ignore:line
            consumerCert = consumerClient.retrieveCertificate(consumerKey.citation);
            expect(consumerCert).to.exist;  // jshint ignore:line
            expect(consumerKey.protocol).to.equal(bali.getStringForKey(consumerCert, '$protocol'));
            expect(consumerKey.tag).to.equal(bali.getStringForKey(consumerCert, '$tag'));
            expect(consumerKey.version).to.equal(bali.getStringForKey(consumerCert, '$version'));
            expect(consumerKey.toString()).contains(bali.getStringForKey(consumerCert, '$publicKey'));
        });

        it('should setup the client environment for the merchant', function() {
            merchantClient = BaliAPI.loadClient('merchant', repository);
            expect(merchantClient).to.exist;  // jshint ignore:line
            merchantKey = merchantClient.notaryKey;
            expect(merchantKey).to.exist;  // jshint ignore:line
            merchantCert = merchantClient.retrieveCertificate(merchantKey.citation);
            expect(merchantCert).to.exist;  // jshint ignore:line
            expect(merchantKey.protocol).to.equal(bali.getStringForKey(merchantCert, '$protocol'));
            expect(merchantKey.tag).to.equal(bali.getStringForKey(merchantCert, '$tag'));
            expect(merchantKey.version).to.equal(bali.getStringForKey(merchantCert, '$version'));
            expect(merchantKey.toString()).contains(bali.getStringForKey(merchantCert, '$publicKey'));
        });

    });

    describe('Test Drafts', function() {
        var tag = bali.tag();
        var version = 'v1.2';
        var draft = bali.parseDocument(source);

        it('should save a new draft document in the repository', function() {
            consumerClient.saveDraft(tag, version, draft);
            expect(draft.toString()).to.equal(source);
            expect(bali.getPreviousCitation(draft)).to.not.exist;  // jshint ignore:line
            expect(bali.getSeals(draft).length).to.equal(0);
        });

        it('should retrieve the new draft document from the repository', function() {
            draft = consumerClient.retrieveDraft(tag, version);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.equal(source);
            expect(bali.getPreviousCitation(draft)).to.not.exist;  // jshint ignore:line
            expect(bali.getSeals(draft).length).to.equal(0);
        });

        it('should save an updated draft document in the repository', function() {
            bali.setValueForKey(draft, '$bar', '"baz"');
            consumerClient.saveDraft(tag, version, draft);
            expect(draft.toString()).to.not.equal(source);
            expect(bali.getStringForKey(draft, '$foo')).to.equal('"bar"');
            expect(bali.getStringForKey(draft, '$bar')).to.equal('"baz"');
            expect(bali.getPreviousCitation(draft)).to.not.exist;  // jshint ignore:line
            expect(bali.getSeals(draft).length).to.equal(0);
        });

        it('should discard the draft document in the repository', function() {
            consumerClient.discardDraft(tag, version);
        });

        it('should verify that the draft document no longer exists in the repository', function() {
            draft = consumerClient.retrieveDraft(tag, version);
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
            citation = consumerClient.commitDocument(tag, version, document);
            expect(citation).contains(tag);
            expect(citation).contains(version);
            expect(bali.getPreviousCitation(document)).to.not.exist;  // jshint ignore:line
            expect(bali.getBody(document).toString() + '\n').to.equal(source);
            expect(bali.getSeals(document).length).to.equal(1);
            var seal = bali.getSeal(document);
            expect(bali.getCitation(seal)).contains(consumerKey.citation);
        });

        it('should retrieve the committed document from the repository', function() {
            var newSource = document.toString();
            document = consumerClient.retrieveDocument(citation);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.equal(newSource);
        });

        it('should checkout a draft of the new document from the repository', function() {
            draft = consumerClient.checkoutDocument(citation, newVersion);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.equal(citation + '\n' + source);
        });

        it('should commit an updated version of the document to the repository', function() {
            bali.setValueForKey(draft, '$bar', '"baz"');
            newCitation = consumerClient.commitDocument(tag, newVersion, draft);
            expect(newCitation).to.not.equal(citation);
            expect(newCitation).contains(tag);
            expect(newCitation).contains(newVersion);
            expect(bali.getStringForKey(draft, '$bar')).to.equal('"baz"');
            expect(bali.getSeals(draft).length).to.equal(1);
            var seal = bali.getSeal(draft);
            expect(bali.getCitation(seal)).contains(consumerKey.citation);
        });

        it('should retrieve the updated committed document from the repository', function() {
            document = consumerClient.retrieveDocument(newCitation);
            expect(document).to.exist;  // jshint ignore:line
            var previousCitation = bali.getPreviousCitation(document);
            expect(previousCitation).to.exist;  // jshint ignore:line
            expect(previousCitation).to.equal(citation);
            expect(bali.getStringForKey(document, '$bar')).to.equal('"baz"');
            expect(bali.getSeals(document).length).to.equal(1);
            var seal = bali.getSeal(document);
            expect(bali.getCitation(seal)).contains(consumerKey.citation);
        });

        it('should checkout the latest version of the document from the repository', function() {
            newVersion = 'v2.4.1';
            draft = consumerClient.checkoutDocument(newCitation, newVersion);
            var previousCitation = bali.getPreviousCitation(draft);
            expect(previousCitation).to.exist;  // jshint ignore:line
            expect(previousCitation).to.equal(newCitation);
            expect(bali.getSeals(draft).length).to.equal(0);
        });

        it('should discard the draft document in the repository', function() {
            consumerClient.discardDraft(tag, newVersion);
        });

        it('should verify that the draft document no longer exists in the repository', function() {
            draft = consumerClient.retrieveDraft(tag, newVersion);
            expect(draft).to.not.exist;  // jshint ignore:line
        });

        it('should make sure the new document still exists in the repository', function() {
            var newSource = document.toString();
            document = consumerClient.retrieveDocument(newCitation);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.equal(newSource);
        });

    });

    describe('Test Messages', function() {
        it('should perform a message lifecycle', function() {
            var queueId = 'queueId';

            // make sure the message queue is empty
            var message = consumerClient.receiveMessage(queueId);
            expect(message).to.not.exist;  // jshint ignore:line

            // queue up some messages
            for (var i = 0; i < 3; i++) {
                // place a new message on the queue
                message = bali.parseDocument(source);
                consumerClient.queueMessage(queueId, message);

                // attempt to place the same message on the queue
                //expect(consumerClient.queueMessage.bind(consumerClient, queueId, message)).to.throw();
                //consumerClient.queueMessage(queueId, message);
            }

            // retrieve the messages
            for (var j = 0; j < 3; j++) {
                // retrieve a message from the queue
                message = merchantClient.receiveMessage(queueId);
                expect(message).to.exist;  // jshint ignore:line
            }

            // make sure the message queue is empty
            message = merchantClient.receiveMessage(queueId);
            expect(message).to.not.exist;  // jshint ignore:line
        });

    });

    describe('Test Events', function() {

    });

});
