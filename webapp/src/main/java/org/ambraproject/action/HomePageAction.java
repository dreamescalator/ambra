/* $HeadURL::                                                                            $
 * $Id$
 *
 * Copyright (c) 2006-2010 by Public Library of Science
 * http://plos.org
 * http://ambraproject.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.ambraproject.action;

import org.ambraproject.service.article.ArticleService;
import org.ambraproject.service.article.BrowseService;
import org.ambraproject.service.journal.JournalService;
import org.ambraproject.views.SearchHit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Required;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;




/**
 * @author stevec
 */
@SuppressWarnings("serial")
public class HomePageAction extends BaseActionSupport {
  private static final Logger log = LoggerFactory.getLogger(HomePageAction.class);

  private ArticleService articleService;
  private JournalService journalService;
  private BrowseService browseService;
  private SortedMap<String, Long> categoryInfos;

  private ArrayList<SearchHit> recentArticles;
  private int numDaysInPast;
  private int numArticlesToShow;

    /**
     * Populate the <b>recentArticles</b> (global) variable with random recent articles of
     * appropriate Article Type(s).
     * <ul>
     *   <li>The number of articles set into the <b>recentArticles</b>
     *     (global) variable determined by the
     *     <i>ambra.virtualJournals.CURRENT_JOURNAL_NAME.recentArticles.numArticlesToShow</i>
     *     configuration property
     *   </li>
     *   <li>The type of articles set into the <b>recentArticles</b> variable is determined by
     *     the list in the
     *   <i>ambra.virtualJournals.CURRENT_JOURNAL_NAME.recentArticles.typeUriListArticlesToShow</i>
     *     configuration property.
     *     If this property is not defined, then <b>all</b> types of articles are shown
     *   </li>
     *   <li>The initial definition of "recent" is the number of days (before today) indicated by
     *     the <i>ambra.virtualJournals.CURRENT_JOURNAL_NAME.recentArticles.numDaysInPast</i>
     *     configuration property.
     *     If not enough articles of the appropriate type are found in that span of time,
     *       then a new query is made for a somewhat longer duration.
     *   </li>
     * </ul>
     * The CURRENT_JOURNAL_NAME is acquired from the {@link BaseActionSupport#getCurrentJournal()}
     */
    private void initRecentArticles() {
      String journalKey = getCurrentJournal();
      String journal_eIssn = journalService.getJournal(journalKey).geteIssn();
      String rootKey = "ambra.virtualJournals." + journalKey + ".recentArticles";

      numDaysInPast = configuration.getInteger(rootKey + ".numDaysInPast", 7);
      numArticlesToShow = configuration.getInteger(rootKey + ".numArticlesToShow", 5);

      //end date is most recent midnight
      //milliseconds in a day: 86400000
      Date endDate = new Date();
      endDate.setTime(endDate.getTime() - endDate.getTime() % 86400000L);
      Date startDate = new Date();
      startDate.setTime(endDate.getTime() - Long.valueOf(numDaysInPast) * 86400000L);

      //  First query.  Just get the articles from "numDaysInPast" ago.
      recentArticles = (ArrayList<SearchHit>) articleService.getArticleURIsTitlesByDate(startDate, endDate, journal_eIssn);


      //did not use for(SearchHit hit : recentArticles){} notation because of ConcurrentModification error
      for(int x = 0; x < recentArticles.size(); x++){
        if(recentArticles.get(x).getUri().indexOf("10.1371/image") > -1 ){
            recentArticles.remove(x);
        }
      }

      // If not enough, then query for articles before ${numDaysInPast} to make up the difference.
      if (recentArticles.size() < numArticlesToShow) {
        int dayCount = 0;

        while (recentArticles.size() < numArticlesToShow && dayCount < 30) {

          endDate = (Date) startDate.clone();
          endDate.setTime(endDate.getTime() - 1000L); //avoid overlap here
          //3 days = 86400000L * 3
          startDate.setTime(startDate.getTime() - 3 * 86400000L);
          recentArticles.addAll(articleService.getArticleURIsTitlesByDate(startDate, endDate, journal_eIssn));
          //discard image articles
          for (SearchHit hit : recentArticles) {
            //image type doi: info:doi/10.1371/image.[journal].[other-stuff]
            if (hit.getUri().indexOf("10.1371/image") > -1) {
              recentArticles.remove(hit);
            }
          }
          dayCount += 3;

        }

      }

      //pare down the actual number of recent articles to match ${numberArticlesToShow}
      int howManyIsTooMany = recentArticles.size() - numArticlesToShow;
      Collections.shuffle(recentArticles);
      while (howManyIsTooMany > 0) {
        // Remove one random article from "recentArticles" and add it to "recentArticlesTemp".
        recentArticles.remove(0);
        howManyIsTooMany--;
      }
    }

  /**
   * This execute method always returns SUCCESS
   */
  @Override
  public String execute() {
    String journal = getCurrentJournal();

    // HACK: the PLOS ONE homepage displays all top-level categories.  With the
    // old taxonomy, we got these results from solr.  However, the new taxonomy
    // has many fewer top-level categories, so it's a lot simpler just to
    // hard code them here.  Still, this should probably be moved somewhere else
    // and/or be done more elegantly.
    if ("PLoSONE".equals(journal)) {
      Map<String, Long> topLevelCategories = new HashMap<String, Long>(10);
      topLevelCategories.put("Physical sciences", 1L);
      topLevelCategories.put("Earth sciences", 1L);
      topLevelCategories.put("Computer and information sciences", 1L);
      topLevelCategories.put("Environmental sciences and ecology", 1L);
      topLevelCategories.put("Social sciences", 1L);
      topLevelCategories.put("Science policy", 1L);
      topLevelCategories.put("Research and analysis methods", 1L);
      topLevelCategories.put("Medicine and health sciences", 1L);
      topLevelCategories.put("Engineering and technology", 1L);
      topLevelCategories.put("Biology and life sciences", 1L);
      categoryInfos = new TreeMap<String, Long>(topLevelCategories);
    } else {
      categoryInfos = browseService.getSubjectsForJournal(journal);
    }
    initRecentArticles();
    return SUCCESS;
  }

  /**
   * @return Returns category and number of articles for each category.
   * Categories are sorted by name.
   */
  public SortedMap<String,Long> getCategoryInfos() {
    return categoryInfos;
  }

  /**
   * Retrieves the most recently published articles in the last 7 days
   *
   * @return array of SearchHit objects
   */
  public List<SearchHit> getRecentArticles() {
    return recentArticles;
  }

  /**
   * @param articleService the ArticleService to set
   */
  @Required
  public void setArticleService(ArticleService articleService) {
    this.articleService = articleService;
  }

  /*
  * @param journalService the JournalService to use
  */
  public void setJournalService(JournalService journalService) {
    this.journalService = journalService;
  }

  /**
   * @param browseService The browseService to set.
   */
  @Required
  public void setBrowseService(BrowseService browseService) {
    this.browseService = browseService;
  }

  public int getNumDaysInPast() {
    return numDaysInPast;
  }

  public int getNumArticlesToShow() {
    return numArticlesToShow;
  }

}
