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

/**
 * This function initializes the Bali Nebula™ API. It requires that a digital notary,
 * a document repository, and a procedure compileer be specified.
 *
 * @param {Object} notary An object that implements the digital notary API.
 * @param {Object} repository An object that implements the document repository API.
 * @param {Object} compiler An object that implements the procedure compiler API.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Object} A singleton object containing the initialized Bali Nebula™ API.
 */
exports.api = function(notary, repository, compiler, debug) {
    const api = require('./src/NebulaAPI').api(notary, repository, compiler, debug);
    return api;
};
