/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for
 * license information.
 */
package com.redislabs.demo.brewdis;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.microsoft.azure.spring.cloud.feature.manager.FeatureFilter;
import com.microsoft.azure.spring.cloud.feature.manager.entities.FeatureFilterEvaluationContext;

import lombok.extern.slf4j.Slf4j;

@Component("BrowserFilter")
@Slf4j
public class BrowserFilter implements FeatureFilter {
    
    private static final String USERAGENT = "User-Agent";
    
    private static final String BROWSER = "browser";

    private static final String EDGE_USERAGENT = "Edg";

    private static final String FIREFOX_USERAGENT = "Firefox";

    private static final String CHROME_USERAGENT = "Chrome";

    private static final String EDGE_BROWSER = "edge";

    private static final String FIREFOX_BROWSER = "firefox";

    private static final String CHROME_BROWSER = "chrome";

    @Autowired
    private HttpServletRequest request;

    @Override
    public boolean evaluate(FeatureFilterEvaluationContext context) {
        String userAgent = request.getHeader(USERAGENT);
        String browser = (String) context.getParameters().get(BROWSER);
        log.error(userAgent + " - " + browser);
        if (userAgent.contains(EDGE_USERAGENT) && browser.equals(EDGE_BROWSER)) {
            return true;
        } else if (userAgent.contains(FIREFOX_USERAGENT) && browser.equals(FIREFOX_BROWSER)) {
            return true;
        } else if (userAgent.contains(CHROME_USERAGENT) && !userAgent.contains(EDGE_USERAGENT)
                && browser.equals(CHROME_BROWSER)) {
            return true;
        }
        return false;
    }
}
