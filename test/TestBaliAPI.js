/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

var BaliAPI = require('../BaliAPI');
var TestRepository = require('../LocalRepository');
var BaliDocument = require('bali-document-notation/BaliDocument');
var codex = require('bali-document-notation/utilities/EncodingUtilities');
var BaliNotary = require('bali-digital-notary/BaliNotary');
var BaliCitation = require('bali-digital-notary/BaliCitation');
var mocha = require('mocha');
var expect = require('chai').expect;

describe('Bali Cloud API™', function() {
    var consumerClient;
    var consumerCitation;
    var consumerCertificate;
    var merchantClient;
    var merchantCitation;
    var merchantCertificate;
    var repository;

    describe('Initialize Environment', function() {

        it('should setup the document repository', function() {
            repository = TestRepository.repository('test/config/');
            expect(repository).to.exist;  // jshint ignore:line
        });

        it('should setup the digital notary for the consumer', function() {
            consumerNotary = BaliNotary.notary('test/config/consumer/');
            expect(consumerNotary).to.exist;  // jshint ignore:line
            consumerCertificate = consumerNotary.generateKeys();
            expect(consumerCertificate).to.exist;  // jshint ignore:line
            consumerCitation = consumerNotary.citation();
            expect(consumerCitation).to.exist;  // jshint ignore:line
            repository.storeCertificate(consumerCitation.tag, consumerCitation.version, consumerCertificate);
        });

        it('should setup the digital notary for the merchant', function() {
            merchantNotary = BaliNotary.notary('test/config/merchant/');
            expect(merchantNotary).to.exist;  // jshint ignore:line
            merchantCertificate = merchantNotary.generateKeys();
            expect(merchantCertificate).to.exist;  // jshint ignore:line
            merchantCitation = merchantNotary.citation();
            expect(merchantCitation).to.exist;  // jshint ignore:line
            repository.storeCertificate(merchantCitation.tag, merchantCitation.version, merchantCertificate);
        });

        it('should setup the client environment for the consumer', function() {
            consumerClient = BaliAPI.environment(consumerNotary, repository);
            expect(consumerClient).to.exist;  // jshint ignore:line
            consumerCitation = consumerClient.retrieveCitation();
            expect(consumerCitation).to.exist;  // jshint ignore:line
            consumerCertificate = consumerClient.retrieveCertificate(consumerCitation);
            expect(consumerCertificate).to.exist;  // jshint ignore:line
        });

        it('should setup the client environment for the merchant', function() {
            merchantClient = BaliAPI.environment(merchantNotary, repository);
            expect(merchantClient).to.exist;  // jshint ignore:line
            merchantCitation = merchantClient.retrieveCitation();
            expect(merchantCitation).to.exist;  // jshint ignore:line
            merchantCertificate = merchantClient.retrieveCertificate(merchantCitation);
            expect(merchantCertificate).to.exist;  // jshint ignore:line
        });

    });

    describe('Test Drafts', function() {
        var tag = codex.randomTag();
        var version = 'v1.2';
        var source = '[$foo: "bar"]\n';
        var draft = BaliDocument.fromSource(source);

        it('should save a new draft document in the repository', function() {
            consumerClient.saveDraft(tag, version, draft);
            expect(draft.toString()).to.equal(source);
            expect(draft.previousReference).to.not.exist;  // jshint ignore:line
            expect(draft.getSeals().length).to.equal(0);
        });

        it('should retrieve the new draft document from the repository', function() {
            draft = consumerClient.retrieveDraft(tag, version);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.equal(source);
            expect(draft.previousReference).to.not.exist;  // jshint ignore:line
            expect(draft.getSeals().length).to.equal(0);
        });

        it('should save an updated draft document in the repository', function() {
            draft.setValue('$bar', '"baz"');
            consumerClient.saveDraft(tag, version, draft);
            expect(draft.toString()).to.not.equal(source);
            expect(draft.getString('$foo')).to.equal('"bar"');
            expect(draft.getString('$bar')).to.equal('"baz"');
            expect(draft.previousReference).to.not.exist;  // jshint ignore:line
            expect(draft.getSeals().length).to.equal(0);
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
        var tag = codex.randomTag();
        var version = 'v2.3.4';
        var newVersion = 'v2.4';
        var draft;
        var document;
        var citation;
        var newCitation;
        var source = '[$foo: "bar"]\n';
        it('should commit a draft of a new document to the repository', function() {
            document = BaliDocument.fromSource(source);
            citation = consumerClient.commitDocument(tag, version, document);
            expect(citation.tag).to.equal(tag);
            expect(citation.version).to.equal(version);
            expect(document.previousReference).to.not.exist;  // jshint ignore:line
            expect(document.documentContent.toString() + '\n').to.equal(source);
            expect(document.getSeals().length).to.equal(1);
            var seal = document.getLastSeal();
            var sealReference = seal.certificateReference;
            var sealCitation = BaliCitation.fromReference(sealReference);
            expect(sealCitation.toString()).to.equal(consumerCitation.toString());
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
            expect(draft.toString()).to.equal(citation.toReference() + '\n' + source);
        });

        it('should commit an updated version of the document to the repository', function() {
            draft.setValue('$bar', '"baz"');
            newCitation = consumerClient.commitDocument(tag, newVersion, draft);
            expect(newCitation.toString()).to.not.equal(citation.toString());
            expect(newCitation.tag).to.equal(tag);
            expect(newCitation.version).to.equal(newVersion);
            expect(consumerClient.nextVersion(newCitation)).to.equal('v2.5');
            expect(draft.getString('$bar')).to.equal('"baz"');
            expect(draft.getSeals().length).to.equal(1);
            var seal = draft.getLastSeal();
            var sealReference = seal.certificateReference;
            var sealCitation = BaliCitation.fromReference(sealReference);
            expect(sealCitation.toString()).to.equal(consumerCitation.toString());
        });

        it('should retrieve the updated committed document from the repository', function() {
            document = consumerClient.retrieveDocument(newCitation);
            expect(document).to.exist;  // jshint ignore:line
            var previousReference = document.previousReference;
            expect(previousReference).to.exist;  // jshint ignore:line
            var previousCitation = BaliCitation.fromReference(previousReference);
            expect(previousCitation.toString()).to.equal(citation.toString());
            expect(document.getString('$bar')).to.equal('"baz"');
            expect(document.getSeals().length).to.equal(1);
            var seal = document.getLastSeal();
            var sealReference = seal.certificateReference;
            var sealCitation = BaliCitation.fromReference(sealReference);
            expect(sealCitation.toString()).to.equal(consumerCitation.toString());
        });

        it('should checkout the latest version of the document from the repository', function() {
            newVersion = 'v2.4.1';
            draft = consumerClient.checkoutDocument(newCitation, newVersion);
            var previousReference = draft.previousReference;
            expect(previousReference).to.exist;  // jshint ignore:line
            var previousCitation = BaliCitation.fromReference(previousReference);
            expect(previousCitation.toString()).to.equal(newCitation.toString());
            expect(draft.getSeals().length).to.equal(0);
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
        var queue = 'queueId';
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
                transaction = BaliDocument.fromSource(source);
                consumerClient.queueMessage(queue, transaction);
                expect(transaction.previousReference).to.not.exist;  // jshint ignore:line
                expect(transaction.documentContent.toString()).contains('$tag:');
                expect(transaction.getSeals().length).to.equal(1);
                var seal = transaction.getLastSeal();
                var sealReference = seal.certificateReference;
                var sealCitation = BaliCitation.fromReference(sealReference);
                expect(sealCitation.toString()).to.equal(consumerCitation.toString());
            }
        });

        it('should allow the merchant to retrieve the transactions from the queue', function() {
            var count = 0;
            var transaction = merchantClient.receiveMessage(queue);
            while (transaction) {
                count++;
                expect(transaction.previousReference).to.not.exist;  // jshint ignore:line
                expect(transaction.getSeals().length).to.equal(1);
                var seal = transaction.getLastSeal();
                var sealReference = seal.certificateReference;
                var sealCitation = BaliCitation.fromReference(sealReference);
                expect(sealCitation.toString()).to.equal(consumerCitation.toString());

                var tag = transaction.getString('$tag');
                var version = 'v1';
                var citation = merchantClient.commitDocument(tag, version, transaction);
                expect(citation.tag).to.equal(tag);
                expect(citation.version).to.equal(version);
                expect(transaction.previousReference).to.not.exist;  // jshint ignore:line
                expect(transaction.getSeals().length).to.equal(2);
                seal = transaction.getLastSeal();
                sealReference = seal.certificateReference;
                sealCitation = BaliCitation.fromReference(sealReference);
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
            var event = BaliDocument.fromSource(source);
            merchantClient.publishEvent(event);
            expect(event.previousReference).to.not.exist;  // jshint ignore:line
            expect(event.documentContent.toString()).contains('$tag:');
            expect(event.getSeals().length).to.equal(1);
            var seal = event.getLastSeal();
            var sealReference = seal.certificateReference;
            var sealCitation = BaliCitation.fromReference(sealReference);
            expect(sealCitation.toString()).to.equal(merchantCitation.toString());
        });


    });

});
