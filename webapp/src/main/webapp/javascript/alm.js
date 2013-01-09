/*
 * $HeadURL$
 * $Id$
 * Copyright (c) 2006-2012 by Public Library of Science http://plos.org http://ambraproject.org
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * ambra.alm
 *
 * This class has utilities for fetching data from the ALM application.
 **/

$.fn.alm = function () {
  this.almHost = $('meta[name=almHost]').attr("content");
  this.pubGetHost = $('meta[name=pubGetHost]').attr("content");
  this.relativeMetricHost = $('meta[name=relativeMetricHost]').attr("content");

  if (this.almHost == null) {
    jQuery.error('The related article metrics server is not defined.  Make sure the almHost is defined in the meta information of the html page.');
  }

  this.isNewArticle = function (pubDateInMilliseconds) {
    //The article publish date should be stored in the current page is a hidden form variable
    var todayMinus48Hours = (new Date()).getTime() - 172800000;

    if (todayMinus48Hours < pubDateInMilliseconds) {
      return true;
    } else {
      return false;
    }
  }

  this.isArticle = function (doi) {
    if (doi.indexOf("image") > -1) {
      return false;
    }
    return true;
  }

  this.validateDOI = function (doi) {
    if (doi == null) {
      throw new Error('DOI is null.');
    }

    doi = encodeURI(doi);

    return doi.replace(new RegExp('/', 'g'), '%2F').replace(new RegExp(':', 'g'), '%3A');
  }

  this.getIDs = function (doi, callBack, errorCallback) {
    doi = this.validateDOI(doi);

    var request = "articles/" + doi + ".json?history=0";
    this.getData(request, callBack, errorCallback);
  }

  this.getRelatedBlogs = function (doi, callBack, errorCallback) {
    doi = this.validateDOI(doi);

    var request = "articles/" + doi + ".json?events=1&source=Nature,Researchblogging,Wikipedia";
    this.getData(request, callBack, errorCallback);
  }

  this.getCites = function (doi, callBack, errorCallback) {
    doi = this.validateDOI(doi);

    var request = "articles/" + doi + ".json?events=1&source=CrossRef,PubMed,Scopus,Wos";
    this.getData(request, callBack, errorCallback);
  }

  this.getChartData = function (doi, callBack, errorCallback) {
    doi = this.validateDOI(doi);

    var request = "articles/" + doi + ".json?events=1&source=Counter,PMC";
    this.getData(request, callBack, errorCallback);
  }

  this.getBiodData = function (doi, callBack, errorCallback) {
    doi = this.validateDOI(doi);

    var request = "articles/" + doi + ".json?events=1&source=Biod";
    this.getData(request, callBack, errorCallback);
  }

  this.getCitesScopusOnly = function (doi, callBack, errorCallback) {
    doi = this.validateDOI(doi);

    var request = "articles/" + doi + ".json?events=1&source=Scopus";
    this.getData(request, callBack, errorCallback);
  }

  this.getCitesCrossRefOnly = function (doi, callBack, errorCallback) {
    doi = this.validateDOI(doi);

    var request = "articles/" + doi + ".json?events=1&source=CrossRef";
    this.getData(request, callBack, errorCallback);
  }

  this.getCitesTwitterOnly = function (doi, callBack, errorCallback) {
    doi = this.validateDOI(doi);

    var request = "articles/" + doi + ".json?events=1&source=Twitter";
    this.getData(request, callBack, errorCallback);
  }

  this.getSocialData = function (doi, callBack, errorCallback) {
    doi = this.validateDOI(doi);

    var request = "articles/" + doi + ".json?events=1&source=Citeulike,Connotea,Facebook,Twitter,Mendeley";
    this.getData(request, callBack, errorCallback);
  }

  /*
   * Get summaries and counter data for the collection of article IDs
   * passed in.  If an article is not found, or a source data is not found
   * The data will be missing in the resultset.
   * */

  this.getSummaryForArticles = function (dois, callBack, errorCallback) {
    idString = "";
    for (a = 0; a < dois.length; a++) {
      if (idString != "") {
        idString = idString + ",";
      }

      idString = idString + this.validateDOI("info:doi/" + dois[a]);
    }

    var request = "group/articles.json?id=" + idString + "&group=statistics";
    this.getData(request, callBack, errorCallback);
  }

  this.containsUsageStats = function (response) {
    var foundStats = false;

    //Check to see if there is counter data, don't bother with the PMC data if there is no data for counter
    for (var a = 0; a < response.article.source.length; a++) {
      var sourceData = response.article.source[a];

      if (sourceData.source == "Counter"
        && sourceData.events != null
        && sourceData.events.length > 0
        ) {
        foundStats = true;
      }
    }

    return foundStats;
  }

  /* Sort the chart data */
  this.sortByYearMonth = function (chartData1, chartData2) {
    if (parseInt(chartData1.year) < parseInt(chartData2.year)) {
      return -1;
    } else {
      if (parseInt(chartData1.year) == parseInt(chartData2.year)) {
        if (parseInt(chartData1.month) == parseInt(chartData2.month)) {
          return 0;
        } else {
          if (parseInt(chartData1.month) < parseInt(chartData2.month)) {
            return -1;
          } else {
            return 1;
          }
        }
      } else {
        return 1;
      }
    }
  }

  /*
   * Massage the chart data into a more 'chartable' structure
   **/
  this.massageChartData = function (sources, pubDateMS) {
    //Do some final calculations on the results
    var pubDate = new Date(pubDateMS);
    var pubYear = pubDate.getFullYear();
    //Add one as getMonth is zero based
    var pubMonth = pubDate.getMonth() + 1;
    var counterViews = null;
    var pmcViews = null;
    var result = {};

    for (var a = 0; a < sources.length; a++) {
      if (sources[a].source == "Counter") {
        counterViews = sources[a].events;
        //Make sure everything is in the right order
        counterViews = counterViews.sort(this.sortByYearMonth);
      }

      if (sources[a].source == "PubMed Central Usage Stats") {
        if (sources[a].events != null && sources[a].events.length > 0) {
          pmcViews = sources[a].events;
          //Make sure everything is in the right order
          pmcViews = pmcViews.sort(this.sortByYearMonth);
        }
      }
    }

    result.totalPDF = 0;
    result.totalXML = 0;
    result.totalHTML = 0;
    result.total = 0;
    result.history = {};

    //Don't display any data from counter for any date before the publication date
    for (var a = 0; a < counterViews.length; a++) {
      if (counterViews[a].year < pubYear || (counterViews[a].year == pubYear && counterViews[a].month < pubMonth)) {
        counterViews.splice(a, 1);
        a--;
      }
    }

    var cumulativeCounterPDF = 0;
    var cumulativeCounterXML = 0;
    var cumulativeCounterHTML = 0;
    var cumulativeCounterTotal = 0;

    //Two loops here, the first one assumes there is no data structure
    //I also assume (for the cumulative counts) that results are in order date descending
    for (var a = 0; a < counterViews.length; a++) {
      var totalViews = this.parseIntSafe(counterViews[a].html_views) + this.parseIntSafe(counterViews[a].xml_views) +
        this.parseIntSafe(counterViews[a].pdf_views);
      var yearMonth = this.getYearMonth(counterViews[a].year, counterViews[a].month);

      result.history[yearMonth] = {};
      result.history[yearMonth].source = {};
      result.history[yearMonth].year = counterViews[a].year;
      result.history[yearMonth].month = counterViews[a].month;
      result.history[yearMonth].source["counterViews"] = {};
      result.history[yearMonth].source["counterViews"].month = counterViews[a].month;
      result.history[yearMonth].source["counterViews"].year = counterViews[a].year;
      result.history[yearMonth].source["counterViews"].totalPDF = this.parseIntSafe(counterViews[a].pdf_views);
      result.history[yearMonth].source["counterViews"].totalXML = this.parseIntSafe(counterViews[a].xml_views);
      result.history[yearMonth].source["counterViews"].totalHTML = this.parseIntSafe(counterViews[a].html_views);
      result.history[yearMonth].source["counterViews"].total = totalViews;

      cumulativeCounterPDF += this.parseIntSafe(counterViews[a].pdf_views);
      cumulativeCounterXML += this.parseIntSafe(counterViews[a].xml_views);
      cumulativeCounterHTML += this.parseIntSafe(counterViews[a].html_views);
      cumulativeCounterTotal += totalViews;

      //Total views so far (for counter)
      result.history[yearMonth].source["counterViews"].cumulativePDF = cumulativeCounterPDF;
      result.history[yearMonth].source["counterViews"].cumulativeXML = cumulativeCounterXML;
      result.history[yearMonth].source["counterViews"].cumulativeHTML = cumulativeCounterHTML;
      result.history[yearMonth].source["counterViews"].cumulativeTotal = cumulativeCounterTotal;

      //Total views so far (for all sources)
      result.history[yearMonth].cumulativeTotal = this.parseIntSafe(result.total) + totalViews;
      result.history[yearMonth].cumulativePDF = result.totalPDF + this.parseIntSafe(counterViews[a].pdf_views);
      result.history[yearMonth].cumulativeXML = result.totalXML + this.parseIntSafe(counterViews[a].xml_views);
      result.history[yearMonth].cumulativeHTML = result.totalHTML + this.parseIntSafe(counterViews[a].html_views);
      result.history[yearMonth].total = totalViews;

      //The grand totals
      result.totalPDF += this.parseIntSafe(counterViews[a].pdf_views);
      result.totalXML += this.parseIntSafe(counterViews[a].xml_views);
      result.totalHTML += this.parseIntSafe(counterViews[a].html_views);
      result.total += totalViews;
    }

    result.totalCounterPDF = cumulativeCounterPDF;
    result.totalCounterXML = cumulativeCounterXML;
    result.totalCounterHTML = cumulativeCounterHTML;
    result.totalCouterTotal = cumulativeCounterTotal;

    var cumulativePMCPDF = 0;
    var cumulativePMCHTML = 0;
    var cumulativePMCTotal = 0;

    if (pmcViews != null) {
      for (var a = 0; a < pmcViews.length; a++) {
        var totalViews = this.parseIntSafe(pmcViews[a]["full-text"]) + this.parseIntSafe(pmcViews[a].pdf);

        // even if we don't display all the pmc data, the running total we display should be correct
        cumulativePMCPDF += this.parseIntSafe(pmcViews[a].pdf);
        cumulativePMCHTML += this.parseIntSafe(pmcViews[a]["full-text"]);
        cumulativePMCTotal += totalViews;

        //Total views for the current period
        var yearMonth = this.getYearMonth(pmcViews[a].year, pmcViews[a].month);

        // if counter doesn't have data for this given month, we are going to ignore it.
        // we assume that counter data doesn't have any gaps

        // if we add the yearMonth here in the history,
        // * the order of the data in the history can get messed up.
        // * the code expects the counter data to exist for the given yearMonth in the history not just pmc data
        // See PDEV-1074 for more information
        if (result.history[yearMonth] == null) {
          continue;
        }

        result.history[yearMonth].source["pmcViews"] = {};

        //Total views so far (for PMC)
        result.history[yearMonth].source["pmcViews"].month = pmcViews[a].month;
        result.history[yearMonth].source["pmcViews"].year = pmcViews[a].year;
        result.history[yearMonth].source["pmcViews"].cumulativePDF = cumulativePMCPDF;
        result.history[yearMonth].source["pmcViews"].cumulativeHTML = cumulativePMCHTML;
        result.history[yearMonth].source["pmcViews"].cumulativeTotal = cumulativePMCTotal;

        result.history[yearMonth].source["pmcViews"].totalPDF = this.parseIntSafe(pmcViews[a].pdf);
        result.history[yearMonth].source["pmcViews"].totalXML = "n.a.";
        result.history[yearMonth].source["pmcViews"].totalHTML = this.parseIntSafe(pmcViews[a]["full-text"]);
        result.history[yearMonth].source["pmcViews"].total = totalViews;

        //Total views so far
        result.history[yearMonth].total += totalViews;
        result.history[yearMonth].cumulativeTotal += totalViews;
        result.history[yearMonth].cumulativePDF += this.parseIntSafe(pmcViews[a].pdf);
        result.history[yearMonth].cumulativeHTML += this.parseIntSafe(pmcViews[a]["full-text"]);

        //The grand totals
        result.totalPDF += this.parseIntSafe(pmcViews[a].pdf);
        result.totalHTML += this.parseIntSafe(pmcViews[a]["full-text"]);
        result.total += totalViews;
      }
    }

    result.totalPMCPDF = cumulativePMCPDF;
    result.totalPMCHTML = cumulativePMCHTML;
    result.totalPMCTotal = cumulativePMCTotal;

    //PMC data is sometimes missing months, here let's hack around it.
    for (year = pubYear; year <= (new Date().getFullYear()); year++) {
      var startMonth = (year == pubYear) ? pubMonth : 1;
      for (month = startMonth; month < 13; month++) {
        //Skips months in the future of the current year
        //Month is zero based, '(new Date().getMonth())' is 1 based.
        if (year == (new Date().getFullYear()) && (month - 1) > (new Date().getMonth())) {
          break;
        }

        yearMonth = this.getYearMonth(year, month);

        if (result.history[yearMonth] != null &&
          result.history[yearMonth].source["pmcViews"] == null) {
          result.history[yearMonth].source["pmcViews"] = {};

          result.history[yearMonth].source["pmcViews"].month = month + 1;
          result.history[yearMonth].source["pmcViews"].year = year;
          result.history[yearMonth].source["pmcViews"].cumulativePDF = 0;
          result.history[yearMonth].source["pmcViews"].cumulativeHTML = 0;
          result.history[yearMonth].source["pmcViews"].cumulativeTotal = 0;
          result.history[yearMonth].source["pmcViews"].totalPDF = 0;
          result.history[yearMonth].source["pmcViews"].totalXML = 0;
          result.history[yearMonth].source["pmcViews"].totalHTML = 0;
          result.history[yearMonth].source["pmcViews"].total = 0;

          //Fill in the cumulatives from the previous month (If it exists)
          var prevMonth = 0;
          var prevYear = 0;

          if (month == 1) {
            prevMonth = 12;
            prevYear = year - 1;
          } else {
            prevMonth = month - 1;
            prevYear = year;
          }

          var prevYearMonthStr = this.getYearMonth(prevYear, prevMonth);

          if (result.history[prevYearMonthStr] != null &&
            result.history[prevYearMonthStr].source["pmcViews"] != null) {
            result.history[yearMonth].source["pmcViews"].cumulativePDF =
              result.history[prevYearMonthStr].source["pmcViews"].cumulativePDF;
            result.history[yearMonth].source["pmcViews"].cumulativeHTML =
              result.history[prevYearMonthStr].source["pmcViews"].cumulativeHTML;
            result.history[yearMonth].source["pmcViews"].cumulativeTotal =
              result.history[prevYearMonthStr].source["pmcViews"].cumulativeTotal;
            result.history[yearMonth].source["pmcViews"].totalPDF = 0;
            result.history[yearMonth].source["pmcViews"].totalHTML = 0;
            result.history[yearMonth].source["pmcViews"].total = 0;
          } else {
            result.history[yearMonth].source["pmcViews"].cumulativePDF = 0;
            result.history[yearMonth].source["pmcViews"].cumulativeHTML = 0;
            result.history[yearMonth].source["pmcViews"].cumulativeTotal = 0;
            result.history[yearMonth].source["pmcViews"].totalPDF = 0;
            result.history[yearMonth].source["pmcViews"].totalHTML = 0;
            result.history[yearMonth].source["pmcViews"].total = 0;
          }
        }
      }
    }

    //If there are no PMC views at all, assume the data is just mising
    if (result.totalPMCTotal == 0) {
      result.totalPMCPDF = 0;
      result.totalPMCHTML = 0;
      result.totalPMCTotal = 0;
    }

    return result;
  }

  //Deprecated, should be removed once browse / search scripts refactored not to use
  //TODO: Confirm we can delete this
  this.massageCounterData = function (data, pubDateMS) {
    //Do some final calculations on the results
    var pubDate = new Date(pubDateMS);
    var pubYear = pubDate.getFullYear();
    //Add one as getMonth is zero based
    var pubMonth = pubDate.getMonth() + 1;

    data.totalPDF = 0;
    data.totalXML = 0;
    data.totalHTML = 0;
    data.total = 0;

    //Don't display any data from any date before the publication date
    for (var a = 0; a < data.length; a++) {
      if (data[a].year < pubYear || (data[a].year == pubYear && data[a].month < pubMonth)) {
        data.splice(a, 1);
        a--;
      }
    }

    for (var a = 0; a < data.length; a++) {
      var totalViews = new Number(data[a].html_views) + new Number(data[a].xml_views) + new Number(data[a].pdf_views);
      //Total views for the current period
      data[a].total = totalViews;

      //Total views so far
      data[a].cumulativeTotal = new Number(data.total) + totalViews;
      data[a].cumulativePDF = data.totalPDF + new Number(data[a].pdf_views);
      data[a].cumulativeXML = data.totalXML + new Number(data[a].xml_views);
      data[a].cumulativeHTML = data.totalHTML + new Number(data[a].html_views);

      //The grand totals
      data.totalPDF += new Number(data[a].pdf_views);
      data.totalXML += new Number(data[a].xml_views);
      data.totalHTML += new Number(data[a].html_views);
      data.total += totalViews;
    }

    return data;
  }

  this.parseIntSafe = function (value) {
    if (isNaN(value)) {
      return 0;
    }

    return parseInt(value);
  }

  this.getYearMonth = function (year, month) {
    if (this.parseIntSafe(month) < 10) {
      return year + "-0" + month;
    } else {
      return year + "-" + month;
    }
  }

  /**
   *  host is the host and to get the JSON response from
   *  chartIndex is the  current index of the charts[] array
   *  callback is the method that populates the chart of  "chartIndex"
   *  errorCallback is the method that gets called when:
   *    --The request fails (Network error, network timeout)
   *    --The request is "empty" (Server responds, but with nothing)
   *    --The callback method fails
   **/
  this.getData = function (request, callBack, errorCallback) {
    var url = this.almHost + "/" + request;

    //I use a third party plugin here for jsonp requests as jQuery doesn't
    //Handle errors well (with jsonp requests)

    $.jsonp({
      url:url,
      context:document.body,
      timeout:20000,
      callbackParameter:"callback",
      success:callBack,
      error: function(xOptions, msg) {
        errorCallback("Our system is having a bad day. We are working on it. Please check back later.")
      }

    });

    console.log(url);
  }


  /**
   * Set cross ref text by DIO
   * @param doi the doi
   * @param crossRefID the ID of the document element to place the result
   * @param pubGetErrorID the ID of the document element to place any pub get errors
   * @param almErrorID the ID of the document element to place the alm error
   * @parem loadingID the ID of the "loading" element to fade out after completion
   */
  this.setCrossRefText = function (doi, crossRefID, pubGetErrorID, almErrorID, loadingID) {
    //almService.getCitesCrossRefOnly(doi, setCrossRefLinks, setCrossRefLinksError);

    var pubGetError = function (response) {
      var errorDiv = $("#" + pubGetErrorID);
      errorDiv.html("Links to PDF files of open access articles " +
        "on Pubget are currently not available, please check back later.");
      errorDiv.show("blind", 500);
      $("#" + loadingID).fadeOut('slow');
    };

    var almError = function (response) {
      var errorDiv = $("#" + almErrorID);
      errorDiv.html("Citations are currently not available, please check back later.");
      errorDiv.show("blind", 500);
      $("#" + loadingID).fadeOut('slow');
    };

    var success = function (response) {
      this.setCrossRefLinks(response, crossRefID, pubGetError);
      $("#" + loadingID).fadeOut('slow');
    };

    //The proxy function forces the success method to be run in "this" context.
    this.getCitesCrossRefOnly(doi, jQuery.proxy(success, this), almError);
  }

  this.getPubGetPDF = function (dois, pubGetError) {
    var doiList = dois[0];

    for (var a = 1; a < dois.length; a++) {
      doiList = doiList + "|" + dois[a];
    }

    var getArgs = {
      url:this.pubGetHost,
      callbackParameter:"callback",
      content:{
        oa_only:"true",
        dois:doiList
      },

      success:function (response) {
        for (var a = 0; a < response.length; a++) {
          var doi = this.fixDoiForID(response[a].doi);
          var url = response[a].values.link;
          var image_src = appContext + "/images/icon_pubgetpdf.gif";
          var image_title = "Get the full text PDF from Pubget";

          var html = "<a href=\"" + url + "\"><img title=\"" +
            image_title + "\" src=\"" + image_src + "\"></a>";

          var domElement = $("#citation_" + doi);

          if (domElement == null) {
            console.warn("Citation not found on page: citation_" + doi);
          } else {
            domElement.innerHTML = html;
          }
        }

        return response;
      },

      error:pubGetError,

      timeout:3000
    };

    $.jsonp(getArgs);
  }

  /**
   * HTML IDs can not have a "/" character in them.
   * @param doi
   */
  this.fixDoiForID = function (doi) {
    return doi.replace(/\//g, ":");
  }

  this.setCrossRefLinks = function (response, crossRefID, pubGetError) {
    var doi = escape(response.article.doi);
    var citationDOIs = new Array();
    var numCitations = 0;

    if (response.article.source != null && response.article.source.length > 0
      && response.article.source[0].events != null && response.article.source[0].events.length > 0) {
      numCitations = response.article.source[0].events.length;
      var html = "";

      for (var a = 0; a < numCitations; a++) {
        var citation = response.article.source[0].events[a].event;
        var citation_url = response.article.source[0].events[a].event_url;
        //Build up list of citation DOIs to pass to pubget
        citationDOIs[a] = citation.doi;

        //  Assume there exists: URI, Title, and DOI.  Anything else may be missing.
        html = html + "<li><span class='article'><a href=\"" + citation_url + "\">"
          + citation.article_title + "</a> <span class=\"pubGetPDFLink\" "
          + "id=\"citation_" + this.fixDoiForID(citation.doi) + "\"></span></span>";

        if (citation.contributors != null) {
          var first_author = "";
          var authors = "";
          var contributors = citation.contributors.contributor;
          if (contributors == undefined) {
            contributors = citation.contributors;
            for (var b = 0; b < contributors.length; b++) {
              if (contributors[b].first_author === true) {
                first_author = contributors[b].surname + " " + contributors[b].given_name.substr(0, 1);
              } else {
                authors = authors + ", " + contributors[b].surname + " " + contributors[b].given_name.substr(0, 1);
              }
            }
            authors = first_author + authors;
          } else {
            if (contributors instanceof Array) {
              for (var b = 0; b < contributors.length; b++) {
                if (contributors[b].first_author === "true") {
                  first_author = contributors[b].surname + " " + contributors[b].given_name.substr(0, 1);
                } else {
                  authors = authors + ", " + contributors[b].surname + " " + contributors[b].given_name.substr(0, 1);
                }
              }
              authors = first_author + authors;
            } else {
              authors = contributors.surname + " " + contributors.given_name.substr(0, 1);
            }
          }
          html = html + "<span class='authors'>" + authors + "</span>";
        }
        html = html + "<span class='articleinfo'>";
        if (citation.journal_title != null && citation.journal_title.length > 0) {
          html = html + citation.journal_title;
        }
        if (citation.year != null && citation.year.length > 0) {
          html = html + " " + citation.year;
        }
        if (citation.volume != null && citation.volume.length > 0) {
          html = html + " " + citation.volume;
        }
        if (citation.issue != null && citation.issue.length > 0) {
          html = html + "(" + citation.issue + ")";
        }
        if (citation.first_page != null && citation.first_page.length > 0) {
          html = html + ": " + citation.first_page;
        }
        html = html + ". doi:" + citation.doi + "</span></li>";
      }
    }

    if (numCitations < 1) {
      html = "<h3>No related citations found</h3>";
    } else {
      var pluralization = "";
      if (numCitations != 1) { // This page should never be displayed if less than 1 citation.
        pluralization = "s";
      }

      html = numCitations + " citation" + pluralization
        + " as recorded by <a href=\"http://www.crossref.org\">CrossRef</a>.  Article published "
        + $.datepicker.formatDate("M dd, yy", new Date(response.article.published))
        + ". Citations updated on "
        + $.datepicker.formatDate("M dd, yy", new Date(response.article.source[0].updated_at))
        + "."
        + " <ol>" + html + "</ol>";
    }

    $("#" + crossRefID).html(html);
    $("#" + crossRefID).show("blind", 500);

    //There is physical limit on the number of DOIS I can put on one get.
    //AKA, a GET string can only be so long before the Web server borks.
    //Limit that here
    var doiLimit = 200;
    if (citationDOIs.length < doiLimit) {
      this.getPubGetPDF(citationDOIs, pubGetError);
    } else {
      for (var b = 0; b < (citationDOIs.length / doiLimit); b++) {
        var start = b * doiLimit;
        var end = (b + 1) * doiLimit;

        this.getPubGetPDF(citationDOIs.slice(start, end), pubGetError);
      }
    }
  }

  /**
   * Sets the bookmarks text
   *
   * @param doi the doi
   * @param bookMarksID the ID of the element to contain the bookmarks text
   * @parem loadingID the ID of the "loading" element to fade out after completion
   */
  this.setBookmarksText = function (doi, bookMarksID, loadingID) {

    var almError = function (message) {
      $("#" + loadingID).fadeOut('slow');
      $("#" + bookMarksID).html("<img src=\"/images/icon_error.png\"/>&nbsp;" + message);
      $("#" + bookMarksID).show("blind", 500);
    };

    var success = function (response) {
      $("#" + loadingID).fadeOut('slow');
      $("#" + bookMarksID).css("display", "none");

      this.setBookmarks(response, bookMarksID);
    };

    this.getSocialData(doi, jQuery.proxy(success, this), jQuery.proxy(almError, this));
  }

  this.setBookmarks = function (response, bookMarksID) {
    var doi = escape($('meta[name=citation_doi]').attr("content"));
    var mendeleyData = null;
    var facebookData = null;

    if (response.article.source.length > 0) {
      var html = "";
      var countTilesCreated = 0;

      for (var a = 0; a < response.article.source.length; a++) {
        var url = response.article.source[a].public_url;
        var tileName = response.article.source[a].source.toLowerCase().replace(" ", "-");
        var countToShowOnTile = 0;

        if (tileName == 'facebook') {  //  Facebook does not need a URL
          facebookData = {
            likes:0,
            shares:0,
            posts:0
          }

          if (response.article.source[a].events) {
            for (var i = 0; i < response.article.source[a].events.length; i++) {
              countToShowOnTile = countToShowOnTile + response.article.source[a].events[i].total_count;
              facebookData.likes += response.article.source[a].events[i].like_count;
              facebookData.shares += response.article.source[a].events[i].share_count;
              facebookData.posts += response.article.source[a].events[i].comment_count;
            }
          }

        } else if (tileName == 'twitter') {  //  Twitter, compose a URL to our own twitter landing page
          countToShowOnTile = response.article.source[a].count;
          url = "/article/twitter/info:doi/" + doi;
        } else if (tileName == 'mendeley') {
          if (response.article.source[a].events != null) {
            countToShowOnTile = response.article.source[a].count;

            var groupData = 0;
            if (response.article.source[a].events.groups != null) {
              groupData = response.article.source[a].events.groups.length;
            }

            mendeleyData = {
              individuals:countToShowOnTile,
              groups:groupData
            }
          }

        } else if (url && tileName) { // Only list links that have DEFINED URLS and NAMES.
          countToShowOnTile = response.article.source[a].count;
        }

        if (countToShowOnTile > 0) {
          if (tileName == 'facebook') {  //  Facebook does NOT get links
            html = html + this.createMetricsTileNoLink(tileName,
              "/images/logo-" + tileName + ".png",
              countToShowOnTile)
              + '\n';
          } else {
            html = html + this.createMetricsTile(tileName,
              url,
              "/images/logo-" + tileName + ".png",
              countToShowOnTile)
              + '\n';
          }
          countTilesCreated++;
        }
      }
    }

    //  If ZERO tiles were created, then hide the header, too.
    if (countTilesCreated > 0) {
      $("#" + bookMarksID).html(html);
      $("#" + bookMarksID).show("blind", 500);
    } else {
      $('#socialNetworksOnArticleMetricsPage').css("display", "none");
    }

    //Here we wire up the tool tips.  We have to do this after the html is appended to
    //the dom because of the way javascript wires events.  In the future, we should create
    //dom nodes and append the nodes with associated events, instead of building up an html
    //string and then inserting the string into the dom
    var fbTile = $("#facebookOnArticleMetricsTab");
    var menTile = $("#mendeleyOnArticleMetricsTab");

    if (fbTile) {
      //Wire up events for display of details box
      fbTile.tooltip({
        delay:250,
        fade:250,
        track:true,
        showURL:false,
        bodyHandler:function () {
          return $("<div class=\"tileTooltip\"><table class=\"tile_mini\">" +
            "<thead><tr><th>Likes</th><th>Shares</th><th>Posts</th></tr>" +
            "</thead><tbody><tr><td class=\"data1\">" + facebookData.likes.format(0, '.', ',') + "</td>" +
            "<td class=\"data2\">" + facebookData.shares.format(0, '.', ',') + "</td><td class=\"data1\">" +
            facebookData.posts.format(0, '.', ',') + "</td></tr>" +
            "</tbody></table></div>");
        }
      });
    }

    if (menTile) {
      //Wire up events for display of details box
      menTile.tooltip({
        backgroundColor:"rgba(255, 255, 255, 0.0)",
        delay:250,
        fade:250,
        track:true,
        shadow:false,
        showURL:false,
        bodyHandler:function () {
          return $("<div class=\"tileTooltip\"><table class=\"tile_mini\">" +
            "<thead><tr><th>Individuals</th><th>Groups</th></tr>" +
            "</thead><tbody><tr><td class=\"data1\">" + mendeleyData.individuals.format(0, '.', ',') + "</td>" +
            "<td class=\"data2\">" + mendeleyData.groups.format(0, '.', ',') + "</td></tr>" +
            "</tbody></table></div>");
        }
      });
    }
  };

  this.createMetricsTile = function (name, url, imgSrc, linkText) {
    return '<div id="' + name + 'OnArticleMetricsTab" class="metrics_tile">' +
      '<a href="' + url + '"><img id="' + name + 'ImageOnArticleMetricsTab" src="' + imgSrc + '" alt="' + linkText + ' ' + name + '" class="metrics_tile_image"/></a>' +
      '<div class="metrics_tile_footer" onclick="location.href=\'' + url + '\';">' +
      '<a href="' + url + '">' + linkText + '</a>' +
      '</div>' +
      '</div>';
  };

  this.createMetricsTileNoLink = function (name, imgSrc, linkText) {
    return '<div id="' + name + 'OnArticleMetricsTab" class="metrics_tile_no_link">' +
      '<img id="' + name + 'ImageOnArticleMetricsTab" src="' + imgSrc + '" alt="' + linkText + ' ' + name + '" class="metrics_tile_image"/>' +
      '<div class="metrics_tile_footer_no_link">' +
      linkText +
      '</div>' +
      '</div>';
  };

  this.setRelatedBlogsText = function (doi, relatedBlogPostsID, errorID, loadingID) {
    var almError = function (message) {
      $("#" + loadingID).fadeOut('slow');
      this.setRelatedBlogError(message, relatedBlogPostsID, errorID);
    };

    var success = function (response) {
      $("#" + loadingID).fadeOut('slow');
      $("#" + relatedBlogPostsID).css("display", "none");

      this.setRelatedBlogs(response, relatedBlogPostsID);
    };

    this.getRelatedBlogs(doi, jQuery.proxy(success, this), jQuery.proxy(almError, this));
  };

  this.setRelatedBlogs = function (response, relatedBlogPostsID) {
    var html = "";
    var doi = escape($('meta[name=citation_doi]').attr("content"));
    var articleTitle = $('meta[name=citation_title]').attr("content");
    var natureViews = 0;
    var wikiViews = 0;

    if (response.article.source.length > 0) {
      html = "";
      // If there is at least one hit for a blog site, then create a link to those blogs.
      // else, if there are zero hits for a blog site, then create a "search for title" link instead.
      for (var a = 0; a < response.article.source.length; a++) {
        var url = response.article.source[a].public_url;
        var tileName = response.article.source[a].source.toLowerCase().replace(" ", "-");
        var count = response.article.source[a].count;

        //Nature is a special case and will always be displayed.
        if (tileName == "nature") {
          natureViews = count;
        } else if (tileName == "wikipedia") {
          wikiViews = count;
        } else {
          if (tileName == "research-blogging") {
            if (count > 0) {
              //Research blogging wants the DOI to search on
              html = html + this.createMetricsTile(tileName,
                url,
                "/images/logo-" + tileName + ".png",
                count + '\n');
            }
          } else {
            //Only list links that HAVE DEFINED URLS
            if (url && count > 0) {
              html = html + this.createMetricsTile(tileName,
                url,
                "/images/logo-" + tileName + ".png",
                count + '\n');
            } else if (response.article.source[a].search_url != null
              && response.article.source[a].search_url.length > 0) {

              html = html + this.createMetricsTile(tileName,
                response.article.source[a].search_url + articleTitle,
                "/images/logo-" + tileName + ".png",
                count + '\n');
            }
          }
        }
      }
    }

    //  If the count for Nature is positive, then show the Nature tile.
    if (natureViews > 0) {
      html = html + this.createMetricsTileNoLink("nature",
        "/images/logo-nature.png",
        natureViews)
        + '\n';
    }

    if (wikiViews > 0) {
      html = html + this.createMetricsTileNoLink("wikipedia",
        "/images/logo-wikipedia.png",
        wikiViews)
        + '\n';
    }

    //  Always show the Google Blogs tile.
    html = html + this.createMetricsTile("google-blogs",
      "http://blogsearch.google.com/blogsearch?as_q=%22" + articleTitle + "%22",
      "/images/logo-googleblogs.png",
      "Search")
      + '\n';

    $("#" + relatedBlogPostsID).html($("#" + relatedBlogPostsID).html() + html);
    $("#" + relatedBlogPostsID).show("blind", 500);
  };

  this.setRelatedBlogError = function (message, successID, errorID) {
    $("#" + successID).css("display", "none");

    var articleTitle = $('meta[name=citation_title]').attr("content");
    var html = "Search for related blog posts on <a href=\"http://blogsearch.google.com/blogsearch?as_q=%22"
      + articleTitle + "%22\">Google Blogs</a><br/><div id=\"relatedBlogPostsError\"></div>";

    $("#" + successID).html(html);
    $("#" + successID).show("blind", 500);

    $("#" + errorID).html("<img src=\"/images/icon_error.png\"/>&nbsp;" + message);
    $("#" + errorID).show("blind", 500);
  };

  this.setCitesText = function (doi, citesID, loadingID) {
    var almError = function (message) {
      $("#" + loadingID).fadeOut('slow');
      $("#" + citesID).html("<img src=\"/images/icon_error.png\"/>&nbsp;" + message);
      $("#" + citesID).show("blind", 500);
    };

    var success = function (response) {
      $("#" + loadingID).fadeOut('slow');
      $("#" + citesID).css("display", "none");

      this.setCites(response, citesID);
      $("#" + citesID).show("blind", 500);
    };

    this.getCites(doi, jQuery.proxy(success, this), almError);
  };

  // Sort into ascending order by the "source" variable of each element.  ALWAYS put Scopus first.
  this.sortCitesBySource = function (a, b) {
    if (b.source.toLowerCase() == 'scopus') {
      return 1;
    } else if (a.source.toLowerCase() == 'scopus' || a.source.toLowerCase() < b.source.toLowerCase()) {
      return -1;
    } else if (a.source.toLowerCase() > b.source.toLowerCase()) {
      return 1;
    }
    return 0;
  };

  this.setCites = function (response, citesID) {
    var numCitesRendered = 0;
    var doi = escape($('meta[name=citation_doi]').attr("content"));
    var html = "";

    if (response.article.source.length > 0) {
      // Citation Sources should always start with Scopus (if an entry for Scopus exists)
      // followed by the rest of the sources in alphabetical order.
      response.article.source = response.article.source.sort(this.sortCitesBySource);

      for (var a = 0; a < response.article.source.length; a++) {
        var url = response.article.source[a].public_url;
        // find all spaces
        var patternForSpace = /\s/g;
        var tileName = response.article.source[a].source.toLowerCase().replace(patternForSpace, "-");
        // removing registered trademark symbol from web of science
        tileName = tileName.replace("\u00ae", "");

        //  If CrossRef, then compose a URL to our own CrossRef Citations page.
        if (response.article.source[a].source == 'CrossRef' && response.article.source[a].count > 0) {
          html = html + this.createMetricsTile(tileName,
            "/article/crossref/info:doi/" + doi,
            "/images/logo-" + tileName + ".png",
            response.article.source[a].count)
            + '\n';
          numCitesRendered++;
        }
        //  Only list links that HAVE DEFINED URLS
        else if (url && response.article.source[a].count > 0) {
          html = html + this.createMetricsTile(tileName,
            url,
            "/images/logo-" + tileName + ".png",
            response.article.source[a].count)
            + '\n';
          numCitesRendered++;
        }
      }
    }

    // A link for searching Google Scholar should ALWAYS show up, but the display of that link
    //   depends on whether there are other citation Metrics Tiles displayed.
    var docURL = "http://dx.plos.org/" + doi.replace("info%3Adoi/", "");
    if (numCitesRendered == 0) {
      html = "No related citations found<br/>Search for citations in <a href=\"http://scholar.google.com/scholar?hl=en&lr=&cites=" + docURL + "\">Google Scholar</a>";
    } else {
      html = html + this.createMetricsTile("googleScholar",
        "http://scholar.google.com/scholar?hl=en&lr=&cites=" + docURL,
        "/images/logo-google-scholar.png",
        "Search");
    }

    $("#" + citesID).html(html);
  };

  this.setChartData = function (doi, usageID, loadingID) {
    //citation_date format = 2006/12/20
    //citation_date format = 2006/2/2

    var publishDate = $.datepicker.parseDate("yy/m/d", $('meta[name=citation_date]').attr("content"));
    publishDatems = publishDate.getTime();

    if (this.isNewArticle(publishDatems)) {
      //The article is less then 2 days old, and there is no data
      //give the user a good error message
      $("#" + usageID).html('This article was only recently published. ' +
        'Although we update our data on a daily basis (not in real time), there may be a 48-hour ' +
        'delay before the most recent numbers are available.<br/><br/>');
      $("#" + usageID).show("blind", 500);
      $("#" + loadingID).fadeOut('slow');
    } else {
      if (this.isArticle(doi)) {
        var almError = function () {
          console.log("almError");

          var message = "Our system is having a bad day. We are working on it. Please check back later.";
          $("#" + loadingID).fadeOut('slow');
          $("#" + usageID).html("<img src=\"/images/icon_error.png\"/>&nbsp;" + message);
          $("#" + usageID).show("blind", 500);
        };

        var success = function (data, relativeMetricData) {
          console.log("success");

          var $usage = $("#" + usageID);
          $("#" + loadingID).fadeOut('slow');
          $usage.css("display", "none");

          var summaryTable = $('<div id="pageViewsSummary"><div id="left"><div class="header">Total Article Views</div>' +
            '<div class="totalCount">' + data.total.format(0, '.', ',') + '</div>' +
            '<div class="pubDates">' + $.datepicker.formatDate('M d, yy', publishDate) + ' (publication date)' +
            '<br>through ' + $.datepicker.formatDate('M d, yy', new Date()) + '*</div></div><div id="right">' +
            '<table id="pageViewsTable"><tbody><tr><th></th><th nowrap="">HTML Page Views</th>' +
            '<th nowrap="">PDF Downloads</th><th nowrap="">XML Downloads</th><th>Totals</th></tr><tr>' +
            '<td class="source1">PLOS</td><td>' + data.totalCounterHTML.format(0, '.', ',') + '</td>' +
            '<td>' + data.totalCounterPDF.format(0, '.', ',') + '</td><td>' + data.totalCounterXML.format(0, '.', ',') + '</td>' +
            '<td class="total">' + data.totalCouterTotal.format(0, '.', ',') + '</td></tr><tr><td class="source2">PMC</td>' +
            '<td>' + data.totalPMCHTML.format(0, '.', ',') + '</td><td>' + data.totalPMCPDF.format(0, '.', ',') + '</td>' +
            '<td>n.a.</td><td class="total">' + data.totalPMCTotal.format(0, '.', ',') + '</td></tr><tr><td>Totals</td>' +
            '<td class="total">' + data.totalHTML.format(0, '.', ',') + '</td><td ' +
            'class="total">' + data.totalPDF.format(0, '.', ',') + '</td><td class="total">' + data.totalXML.format(0, '.', ',') +
            '</td><td class="total">' + data.total.format(0, '.', ',') + '</td></tr>' +
            '<tr class="percent"><td colspan="5"><b>' + ((data.totalPDF / data.totalHTML) * 100).format(2, '.', ',') +
            '%</b> of article views led to PDF downloads</td></tr></tbody></table></div></div>');

          // in IE, Object.keys function is supported in IE 9 and onward
          // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/keys
          var dataHistoryKeys = $.map(data.history, function (value, key) {
            return key;
          });

          $usage.append(summaryTable);

          // Display the graph only if there are at least two data points (months)
          var isGraphDisplayed = Object.keys(data.history).length > 1;
          if (isGraphDisplayed) {
            var options = {
              chart:{
                renderTo:"chart",
                animation:false,
                margin:[40, 40, 40, 80]
              },
              credits:{
                enabled:false
              },
              exporting:{
                enabled:false
              },
              title:{
                text:null
              },
              legend:{
                enabled:false
              },
              xAxis:{
                title:{
                  text:"Months",
                  style:{
                    fontFamily:"'FS Albert Web Regular', Verdana, sans-serif",
                    fontWeight:"normal",
                    color:"#000"
                  },
                  align:"high"
                },
                labels:{
                  step:(dataHistoryKeys.length < 15) ? 1 : Math.round(dataHistoryKeys.length / 15),
                  formatter:function () {
                    return this.value + 1;
                  }
                },
                categories:[]
              },
              yAxis:[
                {
                  title:{
                    text:"Cumulative Views",
                    style:{
                      fontFamily:"'FS Albert Web Regular', Verdana, sans-serif",
                      fontWeight:"normal",
                      color:"#000",
                      height:"50px"
                    }
                  },
                  labels:{
                    style:{
                      color:"#000"
                    }
                  }
                }
              ],
              plotOptions:{
                column:{
                  stacking:"normal"
                },
                animation:false,
                series:{
                  pointPadding:0,
                  groupPadding:0,
                  borderWidth:0,
                  shadow:false
                }
              },
              series:[
                {
                  name:"PMC",
                  type:"column",
                  data:[],
                  color:"#6d84bf"
                },
                {
                  name:"PLoS",
                  type:"column",
                  data:[],
                  color:"#3c63af"
                },
                {
                  name:"RelativeMetric",
                  type:"line",
                  data:[],
                  color:"#01DF01",
                  marker:{
                    enabled:false,
                    states: {
                      hover: {
                        enabled: false
                      }
                    }
                  }
                }
              ],
              tooltip:{
                //Make background invisible
                backgroundColor:"rgba(255, 255, 255, 0.0)",
                useHTML:true,
                shared:true,
                shadow:false,
                borderWidth:0,
                borderRadius:0,
                positioner:function (labelHeight, labelWidth, point) {
                  var newX = point.plotX + (labelWidth / 2) + 25,
                    newY = point.plotY - (labelHeight / 2) + 25;
                  return { x:newX, y:newY };
                },
                formatter:function () {
                  var key = this.points[0].key,
                    h = data.history;

                  return '<table id="mini" cellpadding="0" cellspacing="0">'
                    + '<tr><th></td><td colspan="2">Views in '
                    + $.datepicker.formatDate('M yy', new Date(h[key].year, h[key].month - 1, 2))
                    + '</td><td colspan="2">Views since ' + $.datepicker.formatDate('M yy', new Date(h[key].year, h[key].month - 1, 2))
                    + '</td></tr><tr><th>Source</th><th class="header1">PLoS</th><th class="header2">PMC</th>'
                    + '<th class="header1">PLoS</th><th class="header2">PMC</th></tr>'
                    + '<tr><td>HTML</td><td class="data1">' + h[key].source.counterViews.totalHTML + '</td>'
                    + '<td class="data2">' + (h[key].source.hasOwnProperty("pmcViews") ?
                    h[key].source.pmcViews.totalHTML.format(0, '.', ',') : "n.a.") + '</td>'
                    + '<td class="data1">' + h[key].source.counterViews.cumulativeHTML.format(0, '.', ',') + '</td>'
                    + '<td class="data2">' + (h[key].source.hasOwnProperty("pmcViews") ?
                    h[key].source.pmcViews.cumulativeHTML.format(0, '.', ',') : "n.a.") + '</td></tr>'
                    + '<tr><td>PDF</td><td class="data1">' + h[key].source.counterViews.totalPDF + '</td>'
                    + '<td class="data2">' + (h[key].source.hasOwnProperty("pmcViews") ?
                    h[key].source.pmcViews.totalPDF.format(0, '.', ',') : "n.a.") + '</td>'
                    + '<td class="data1">' + h[key].source.counterViews.cumulativePDF.format(0, '.', ',') + '</td>'
                    + '<td class="data2">' + (h[key].source.hasOwnProperty("pmcViews") ?
                    h[key].source.pmcViews.cumulativePDF.format(0, '.', ',') : "n.a.") + '</td></tr>'
                    + '<tr><td>XML</td><td class="data1">' + h[key].source.counterViews.totalXML + '</td>'
                    + '<td class="data2">n.a.</td>'
                    + '<td class="data1">' + h[key].source.counterViews.cumulativeXML.format(0, '.', ',') + '</td>'
                    + '<td class="data2">n.a.</td></tr>'
                    + '<tr><td>Total</td><td class="data1">' + h[key].source.counterViews.total + '</td>'
                    + '<td class="data2">' + (h[key].source.hasOwnProperty("pmcViews") ?
                    h[key].source.pmcViews.total.format(0, '.', ',') : "n.a.") + '</td>'
                    + '<td class="data1">' + h[key].source.counterViews.cumulativeTotal.format(0, '.', ',') + '</td>'
                    + '<td class="data2">' + (h[key].source.hasOwnProperty("pmcViews") ?
                    h[key].source.pmcViews.cumulativeTotal.format(0, '.', ',') : "n.a.") + '</td></tr>'
                    + '</table>';
                }
              }
            };

            for (var key in data.history) {
              if (data.history[key].source.pmcViews != null) {
                options.series[0].data.push({ name:key, y:data.history[key].source.pmcViews.cumulativeTotal });
              } else {
                options.series[0].data.push({ name:key, y:0 });
              }
              options.series[1].data.push({ name:key, y:data.history[key].source.counterViews.cumulativeTotal });

              // relative metric data
              if (relativeMetricData) {
                if (relativeMetricData.data[key]) {
                  options.series[2].data.push({ name:key, y:relativeMetricData.data[key] });
                } else {
                  options.series[2].data.push({ name:key, y:0 });
                }
              }
            }

            $usage.append($('<div id="chart"></div>')
              .css("width", "600px")
              .css("height", "200px"));

            var chart = new Highcharts.Chart(options);
          } // end if (isGraphDisplayed)

          $usage.append($('<p>*Although we update our data on a daily basis, there may be a 48-hour delay before the most recent numbers are available. PMC data is posted on a monthly basis and will be made available once received.</p>'));
          $usage.show("blind", 500);
        };

        doi = this.validateDOI(doi);

        var almRequestUrl = this.almHost + "/articles/" + doi + ".json?events=1&source=Counter,PMC";

        var documentId = "combined%3A" + doi;
        var relativeMetricUrl = this.relativeMetricHost + "/" + documentId;

        var almResponseData = null;

        var almSuccess = function(data) {
          console.log("almSuccess");

          almResponseData = data;

          return $.jsonp({
            url:relativeMetricUrl,
            context:document.body,
            timeout:20000,
            callbackParameter:"callback"
          });
        };

        var relativeMetricSuccess = function(data) {
          console.log("relativeMetricSuccess");

          var massagedChartData = this.massageChartData(almResponseData.article.source, publishDatems);
          success(massagedChartData, data);
        };

        var relativeMetricError = function() {
          console.log("relativeMetricError");

          if (almResponseData) {
            var massagedChartData = this.massageChartData(almResponseData.article.source, publishDatems);
            success(massagedChartData, null);
          }
        };

        var almRequest = $.jsonp({
            url:almRequestUrl,
            context:document.body,
            timeout:20000,
            callbackParameter:"callback"
          });

        var relativeMetricRequest = almRequest.then(almSuccess, almError);

        relativeMetricRequest.then(jQuery.proxy(relativeMetricSuccess, this), jQuery.proxy(relativeMetricError, this));
      }
    }
  };
}

$(document).ready(
  function () {
    //If the almViews node exists, assume almCitations exists as well and populate them with
    //TODO: Review if this should go into it's own file or not.
    //Appropriate results.

    var fadeInDuration = 300, twoDaysInMilliseconds = 172800000;

    if ($("#almSignPost").length > 0) {
      var almService = new $.fn.alm(),
        doi = $('meta[name=citation_doi]').attr("content"),
        publishDate = $.datepicker.parseDate("yy/m/d", $('meta[name=citation_date]').attr("content")),
        publishDatems = publishDate.getTime();

      var almError = function (message) {
        $("#almSignPostSpinner").css("display", "none");

        if (publishDatems > ((new Date().getTime()) - twoDaysInMilliseconds)) {
          //If the article is less then two days old and there might not be any data for the article
          // do not display anything
        } else {
          // TODO: should come up with a better way to caluclate the height of the li element
          $('#almSignPost').append($('<li></li>').text("metrics unavailable").css('vertical-align', 'middle').css('height', '65px'));
          $('#almSignPost').fadeIn(fadeInDuration);
        }
      };

      var almSuccess = function (response) {
        if (response[0].groups.length > 0) {
          var viewdata = almService.massageChartData(response[0].groups[0].sources, publishDatems);

          var li = $('<li><span class="num">' + viewdata.total.format(0, '.', ',') + '</span> VIEWS<br/><br/></li>');
          $("#almSignPost").append(li);
        }

        var scopus = 0;
        var bookmarks = 0;
        var shares = 0;

        for (var curGroup = 0; curGroup < response[0].groupcounts.length; curGroup++) {
          for (var curSource = 0; curSource < response[0].groupcounts[curGroup].sources.length; curSource++) {
            var name = response[0].groupcounts[curGroup].sources[curSource].source;
            var count = response[0].groupcounts[curGroup].sources[curSource].count;

            if (name == "Scopus") {
              scopus = count;
            }

            if (name == "Mendeley" || name == "CiteULike" || name == "Connotea") {
              bookmarks += count;
            }

            if (name == "Facebook" || name == "Twitter") {
              shares += count;
            }
          }
        }

        var text, li;
        if (scopus > 0) {
          text = "CITATIONS";
          if (scopus == 1) {
            text = "CITATION";
          }

          li = $('<li><span class="num">' + scopus.format(0, '.', ',') + '</span> ' + text + '<br/><br/></li>');
          $("#almSignPost").append(li);
        }

        if (bookmarks > 0) {
          text = "ACADEMIC BOOKMARKS";
          if (bookmarks == 1) {
            text = "ACADEMIC BOOKMARK";
          }

          li = $('<li><span class="num">' + bookmarks.format(0, '.', ',') + '</span> ' + text + '</li>');
          $("#almSignPost").append(li);
        }

        if (shares > 0) {
          text = "SOCIAL SHARES";
          if (shares == 1) {
            text = "SOCIAL SHARE";
          }

          li = $('<li><span class="num">' + shares.format(0, '.', ',') + '</span> ' + text + '</li>');
          $("#almSignPost").append(li);
        }

        $('#almSignPost').fadeIn(fadeInDuration);
      };

      almService.getSummaryForArticles([ doi ], almSuccess, almError);
    }
  }
);