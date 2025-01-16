addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});


function isHTMLContentTypeAccepted(request) {
  const acceptHeader = request.headers.get("Accept");
  return (
    typeof acceptHeader === "string" && acceptHeader.indexOf("text/html") >= 0
  );  
}


async function gatherResponse(response) {
  const { headers } = response;
  const contentType = headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return JSON.stringify(await response.json());
  } else if (contentType.includes('application/text')) {
    return response.text();
  } else if (contentType.includes('text/html')) {
    return response.text();
  } else {
    return response.text();
  }
}


async function handleRequest(request) {

  const response = await fetch(request);

  // catch all 4xx and 5xx errors or url contains error page
  //if (response.status >= 400 && isHTMLContentTypeAccepted(request)) {
  if ((response.status >= 400 || request.url.includes("/error") || request.url.includes("/Error")) && isHTMLContentTypeAccepted(request)) {
    
    // Get URL name
    const url = new URL(request.url);

    const init = {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    }
    
    const PORTALS = ['tap.mhs.com', 'assess.mhs.com'];
    const ASSESSMENT_PORTALS = ['a2.mhs.com', 's.mhs.com', 'dg.mhs.com'];
    const MHSCOMPORTAL = ['testsite.mhs.com', 'mhs.com'];
            
    // if Maintenance page with error 503 return original page app_offline.htm from the portal
    if (response.status == 503 && PORTALS.includes(url.hostname)) {
    
      return response;
    }
    // For ASSESSMENT PORTALS and participants display assessment_error_page.html
    else if (ASSESSMENT_PORTALS.includes(url.hostname)) {
      
      const assessment_error_page = 'https://mhscdn.blob.core.windows.net/mhsdocs/Friendly_error_graphics/assessment_error_page.html';
      const assessment_error_response = await fetch(assessment_error_page, init);
      var assessment_error_results = await gatherResponse(assessment_error_response);
      //replace variables with response value and text.
      assessment_error_results = assessment_error_results.replace( '${response.status}' , response.status)
      assessment_error_results = assessment_error_results.replace( '${response.statusText}' , response.statusText)

      return new Response(assessment_error_results, init);
    }
    // For MHS.COM PORTAL display custom mhscom_error_page.html
    else if (MHSCOMPORTAL.includes(url.hostname)) {

      const mhs_error_page = 'https://mhscdn.blob.core.windows.net/mhsdocs/Friendly_error_graphics/mhscom_error_page.html';
      const mhs_error_response = await fetch(mhs_error_page, init);
      var mhs_error_results = await gatherResponse(mhs_error_response);
      //replace variables with response value and text.
      mhs_error_results = mhs_error_results.replace( '${response.status}' , response.status)
      mhs_error_results = mhs_error_results.replace( '${response.statusText}' , response.statusText)

      return new Response(mhs_error_results, init);
    }
    // for rest of the portals display assessment_error_page.html
    else {
      const error_page = 'https://mhscdn.blob.core.windows.net/mhsdocs/Friendly_error_graphics/error_page.html';
      const error_response = await fetch(error_page, init);
      var error_results = await gatherResponse(error_response);
      //replace variables with response value and text.
      error_results = error_results.replace( '${response.status}' , response.status)
      error_results = error_results.replace( '${response.statusText}' , response.statusText)

      return new Response(error_results, init);
    }
  }

  // otherwise return original response
  return response;
}