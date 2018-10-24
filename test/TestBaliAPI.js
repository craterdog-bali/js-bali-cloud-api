/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

var mocha = require('mocha');
var expect = require('chai').expect;
var bali = require('bali-document-notation');
var notary = require('bali-digital-notary');
var api = require('../src/BaliAPI');
var repository = require('../src/LocalRepository').repository('test/config/');

describe('Bali Cloud API™', function() {
    var consumerNotary;
    var consumerClient;
    var consumerCitation;
    var consumerCertificate;
    var merchantNotary;
    var merchantClient;
    var merchantCitation;
    var merchantCertificate;

    describe('Initialize Environment', function() {

        it('should setup the document repository', function() {
            expect(repository).to.exist;  // jshint ignore:line
        });

        it('should setup the digital notary for the consumer', function() {
            consumerNotary = notary.notaryKey('test/config/consumer/');
            expect(consumerNotary).to.exist;  // jshint ignore:line
            consumerCertificate = consumerNotary.generateKeys();
            expect(consumerCertificate).to.exist;  // jshint ignore:line
            consumerCitation = consumerNotary.getNotaryCitation();
            expect(consumerCitation).to.exist;  // jshint ignore:line
            repository.storeCertificate(consumerCertificate);
        });

        it('should setup the digital notary for the merchant', function() {
            merchantNotary = notary.notaryKey('test/config/merchant/');
            expect(merchantNotary).to.exist;  // jshint ignore:line
            merchantCertificate = merchantNotary.generateKeys();
            expect(merchantCertificate).to.exist;  // jshint ignore:line
            merchantCitation = merchantNotary.getNotaryCitation();
            expect(merchantCitation).to.exist;  // jshint ignore:line
            repository.storeCertificate(merchantCertificate);
        });

        it('should setup the client environment for the consumer', function() {
            consumerClient = api.cloud(consumerNotary, repository);
            expect(consumerClient).to.exist;  // jshint ignore:line
            var citation = consumerClient.retrieveCitation();
            expect(citation).to.exist;  // jshint ignore:line
            expect(citation.equalTo(consumerCitation)).to.equal(true);
            consumerCertificate = consumerClient.retrieveCertificate(consumerCitation);
            expect(consumerCertificate).to.exist;  // jshint ignore:line
        });

        it('should setup the client environment for the merchant', function() {
            merchantClient = api.cloud(merchantNotary, repository);
            expect(merchantClient).to.exist;  // jshint ignore:line
            var citation = merchantClient.retrieveCitation();
            expect(citation).to.exist;  // jshint ignore:line
            expect(citation.equalTo(merchantCitation)).to.equal(true);
            merchantCertificate = merchantClient.retrieveCertificate(merchantCitation);
            expect(merchantCertificate).to.exist;  // jshint ignore:line
        });

    });

    describe('Test Drafts', function() {
        var draft;
        var draftCitation;
        var draftSource;

        it('should create a new draft document', function() {
            draftCitation = consumerClient.createDraft();
            draft = consumerClient.retrieveDraft(draftCitation);
            draft.setValue('$foo', '"bar"');
            draftSource = draft.toSource();
        });

        it('should save a new draft document in the repository', function() {
            consumerClient.saveDraft(draftCitation, draft);
            expect(draft.toString()).to.equal(draftSource);
            expect(draft.previousReference).to.not.exist;  // jshint ignore:line
            expect(draft.notarySeals.length).to.equal(0);
        });

        it('should retrieve the new draft document from the repository', function() {
            draft = consumerClient.retrieveDraft(draftCitation);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.equal(draftSource);
            expect(draft.previousReference).to.not.exist;  // jshint ignore:line
            expect(draft.notarySeals.length).to.equal(0);
        });

        it('should save an updated draft document in the repository', function() {
            draft.setValue('$bar', '"baz"');
            consumerClient.saveDraft(draftCitation, draft);
            expect(draft.toString()).to.not.equal(draftSource);
            expect(draft.getString('$foo')).to.equal('"bar"');
            expect(draft.getString('$bar')).to.equal('"baz"');
            expect(draft.previousReference).to.not.exist;  // jshint ignore:line
            expect(draft.notarySeals.length).to.equal(0);
        });

        it('should discard the draft document in the repository', function() {
            consumerClient.discardDraft(draftCitation);
        });

        it('should verify that the draft document no longer exists in the repository', function() {
            draft = consumerClient.retrieveDraft(draftCitation);
            expect(draft).to.not.exist;  // jshint ignore:line
        });

    });

    describe('Test Documents', function() {
        var newVersion;
        var draft;
        var draftCitation;
        var draftSource;
        var newReference;
        var document;
        var documentCitation;
        var newCitation;

        it('should create a new draft document', function() {
            draftCitation = consumerClient.createDraft();
            draft = consumerClient.retrieveDraft(draftCitation);
            draft.setValue('$foo', '"bar"');
            draftSource = draft.toSource();
        });


        it('should commit a draft of a new document to the repository', function() {
            documentCitation = consumerClient.commitDraft(draftCitation, draft);
            expect(documentCitation.getValue('$tag').equalTo(draftCitation.getValue('$tag'))).to.equal(true);
            expect(documentCitation.getValue('$version').equalTo(draftCitation.getValue('$version'))).to.equal(true);
            document = consumerClient.retrieveDocument(documentCitation);
            expect(document.previousReference).to.not.exist;  // jshint ignore:line
            expect(document.documentContent.toString() + '\n').to.equal(draftSource);
            expect(document.notarySeals.length).to.equal(1);
            var seal = document.getLastSeal();
            var sealCitation = consumerNotary.extractCitation(seal.certificateReference);
            expect(sealCitation.equalTo(consumerCitation)).to.equal(true);
        });

        it('should retrieve the committed document from the repository', function() {
            var newSource = document.toString();
            document = consumerClient.retrieveDocument(documentCitation);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.equal(newSource);
        });

        it('should checkout a draft of the new document from the repository', function() {
            draft = consumerClient.checkoutDocument(documentCitation, newVersion);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.equal(documentCitation + '\n' + draftSource);
        });

        it('should commit an updated version of the document to the repository', function() {
            draft.setValue('$bar', '"baz"');
            newCitation = consumerClient.commitDraft(newReference, draft);
            expect(newCitation.toString()).to.not.equal(documentCitation.toString());
            expect(newCitation.getValue('$tag').equalTo(draftCitation.getValue('$tag'))).to.equal(true);
            expect(newCitation.getValue('$version').equalTo(bali.Version.nextVersion(draftCitation.getValue('$version')))).to.equal(true);
            expect(draft.getString('$bar')).to.equal('"baz"');
            expect(draft.notarySeals.length).to.equal(1);
            var seal = draft.getLastSeal();
            var sealCitation = notary.extractCitation(seal.certificateReference);
            expect(sealCitation.equalTo(consumerCitation)).to.equal(true);
        });

        it('should retrieve the updated committed document from the repository', function() {
            document = consumerClient.retrieveDocument(newCitation);
            expect(document).to.exist;  // jshint ignore:line
            var previousCitation = notary.extractCitation(document.previousReference);
            expect(previousCitation).to.exist;  // jshint ignore:line
            expect(previousCitation.toString()).to.equal(documentCitation.toString());
            expect(document.getString('$bar')).to.equal('"baz"');
            expect(document.notarySeals.length).to.equal(1);
            var seal = document.getLastSeal();
            var sealCitation = notary.extractCitation(seal.certificateReference);
            expect(sealCitation.toString()).to.equal(consumerCitation.toString());
        });

        it('should checkout the latest version of the document from the repository', function() {
            newVersion = 'v2.4.1';
            draft = consumerClient.checkoutDocument(newCitation, newVersion);
            var previousCitation = notary.extractCitation(draft.previousReference);
            expect(previousCitation).to.exist;  // jshint ignore:line
            expect(previousCitation.toString()).to.equal(newCitation.toString());
            expect(draft.notarySeals.length).to.equal(0);
        });

        it('should discard the draft document in the repository', function() {
            consumerClient.discardDraft(newReference);
        });

        it('should verify that the draft document no longer exists in the repository', function() {
            draft = consumerClient.retrieveDraft(newReference);
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
        var queue = '#QSZNT8ABGSF75XR8FWHMYQCKTVK2WCPY';
        var source =
            '[\n' +
            '    $date: <2018-04-01>\n' +
            '    $product: "Snickers Bar"\n' +
            '    $quantity: 10\n' +
            '    $price: 1.25(USD)\n' +
            '    $tax: 1.07(USD)\n' +
            '    $total: 13.57(USD)\n' +
            ']\n';

        it('should allow the merchant to verify that the queue is empty', function() {
            var message = merchantClient.receiveMessage(queue);
            expect(message).to.not.exist;  // jshint ignore:line
        });

        it('should allow the consumer to place some transactions on the queue', function() {
            for (var i = 0; i < 3; i++) {
                transaction = bali.parser.parseDocument(source);
                consumerClient.queueMessage(queue, transaction);
                expect(transaction.previousReference).to.not.exist;  // jshint ignore:line
                expect(transaction.documentContent.toString()).contains('$tag:');
                expect(transaction.notarySeals.length).to.equal(1);
                var seal = transaction.getLastSeal();
                var sealCitation = seal.certificateReference;
                expect(sealCitation.toString()).to.equal(consumerCitation.toString());
            }
        });

        it('should allow the merchant to retrieve the transactions from the queue', function() {
            var count = 0;
            var transaction = merchantClient.receiveMessage(queue);
            while (transaction) {
                count++;
                expect(transaction.previousReference).to.not.exist;  // jshint ignore:line
                expect(transaction.notarySeals.length).to.equal(1);
                var seal = transaction.getLastSeal();
                var sealCitation = seal.certificateReference;
                expect(sealCitation.toString()).to.equal(consumerCitation.toString());

                var tag = transaction.getString('$tag');
                var version = 'v1';
                var reference = merchantClient.getReference(tag, version);
                var documentCitation = merchantClient.commitDraft(reference, transaction);
                expect(merchantClient.getTag(documentCitation)).to.equal(tag);
                expect(merchantClient.getVersion(documentCitation)).to.equal(version);
                expect(transaction.previousReference).to.not.exist;  // jshint ignore:line
                expect(transaction.notarySeals.length).to.equal(2);
                seal = transaction.getLastSeal();
                sealCitation = seal.certificateReference;
                expect(sealCitation.toString()).to.equal(merchantCitation.toString());

                transaction = merchantClient.receiveMessage(queue);
            }
            expect(count).to.equal(3);
        });

    });

    describe('Test Events', function() {
        var source =
            '[\n' +
            '    $type: $TransactionPosted\n' +
            '    $transaction: <bali:[$protocol:v1,$tag:#WTFL0GLK7V5SJBZKCX9NH0KQWH0JYBL9,$version:v1,$hash:\'R5BXA11KMC4W117RNY197MQVJ78VND18FXTXPT1A0PL2TYKYPHZTAAVVA6FHBRZ9N46P7102GSY8PVTQBBFTF3QYS8Q02H9S3ZLP8L8\']>\n' +
            ']\n';

        it('should allow the merchant to verify that the queue is empty', function() {
            var event = bali.parser.parseDocument(source);
            merchantClient.publishEvent(event);
            expect(event.previousReference).to.not.exist;  // jshint ignore:line
            expect(event.documentContent.toString()).contains('$tag:');
            expect(event.notarySeals.length).to.equal(1);
            var seal = event.getLastSeal();
            var sealCitation = seal.certificateReference;
            expect(sealCitation.toString()).to.equal(merchantCitation.toString());
        });


    });

});
