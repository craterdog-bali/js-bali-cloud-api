/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/
'use strict';

/*
 * This library provides useful functions for accessing the Bali Cloud
 * Environment™.
 */


// PUBLIC FUNCTIONS

/**
 * This function retrieves a copy of the Bali document associated with the
 * specified reference from the Bali Cloud Environment™.
 * 
 * @param {Reference} reference A reference to the document to be read.
 * @returns {Document} The corresponding document.
 */
exports.readDocument = function(reference) {
    console.log('readDocument(' + reference + ')');
};


/**
 * This function checks out a new version of the Bali document associated
 * with the specified reference from the Bali Cloud Environment™. The version
 * of the document may then be modified and saved back to the Bali Cloud
 * Environment™ as a draft or as the new version..
 * 
 * @param {Reference} reference A reference to the document to be checked out.
 * @returns {Document} A new version of the corresponding document.
 */
exports.checkoutDocument = function(reference) {
    console.log('checkoutDocument(' + reference + ')');
};


/**
 * This function saves a draft of a Bali document associated with the specified
 * reference into the Bali Cloud Environment™. The version of the document may
 * then be modified and saved back to the Bali Cloud Environment™.
 * 
 * @param {Reference} reference A reference to the document to be saved.
 * @param {Document} document The new version of the document to be saved.
 */
exports.saveDraft = function(reference, document) {
    console.log('saveDraft(' + reference + ', ' +  document + ')');
};


/**
 * This function discards a draft of a Bali document associated with the specified
 * reference that has been saved into the Bali Cloud Environment™.
 * 
 * @param {Reference} reference A reference to the document to be discarded
 */
exports.discardDraft = function(reference) {
    console.log('discardDraft(' + reference + ')');
};


/**
 * This function commits a new version of a Bali document associated with the
 * specified reference to the Bali Cloud Environment™.
 * 
 * @param {Reference} reference A reference to the document to be committed.
 * @param {Document} document The new version of the document to be committed.
 */
exports.commitDocument = function(reference, document) {
    console.log('commitDocument(' + reference + ', ' +  document + ')');
};


/**
 * This function retrieves a message from the message queue associated with the
 * specified reference in the Bali Cloud Environment™. If there are no messages
 * currently on the queue then this function returns Template.NONE.
 * 
 * @param {Reference} reference A reference to the message queue.
 * @returns {Document} The received message.
 */
exports.receiveMessage = function(reference) {
    console.log('receiveMessage(' + reference + ')');
};


/**
 * This function sends a message to the message queue associated with the
 * specified reference in the Bali Cloud Environment™.
 * 
 * @param {Reference} reference A reference to the message queue.
 * @returns {Document} The message to be send.
 */
exports.sendMessage = function(reference, message) {
    console.log('sendMessage(' + reference + ', ' +  message + ')');
};


/**
 * This function publishes an event to the Bali Cloud Environment™. Any task that
 * is interested in the event will be automatically notified.
 * 
 * @param {Document} event The event to be published.
 */
exports.publishEvent = function(event) {
    console.log('publishEvent(' + event + ')');
};

