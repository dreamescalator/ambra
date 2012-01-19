/* $HeadURL http://ambraproject.org/svn/ambra/branches/ANH-Conversion/ambra/webapp/src/test/java/org/topazproject/ambra/rating/RatingServiceImplTest.java $
 * $Id AnnotationServiceTest.java 9530 2011-09-09 23:22:00Z msingh $
 * Copyright (c) 2006-2011 by Public Library of Science http://plos.org http://ambraproject.org
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.topazproject.ambra.rating;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.hibernate3.HibernateObjectRetrievalFailureException;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;
import org.topazproject.ambra.ApplicationException;
import org.topazproject.ambra.BaseTest;
import org.topazproject.ambra.models.*;
import org.topazproject.ambra.rating.service.RatingsService;
import org.topazproject.ambra.testutils.MockAmbraUser;

import java.net.MalformedURLException;
import java.net.URI;
import java.util.List;

import static org.testng.Assert.*;

/**
 * Test for methods of {@link RatingsService}.
 */

public class RatingServiceTest extends BaseTest{

  @Autowired
  protected RatingsService ratingsService;

  @DataProvider(name = "ratingToDelete")
  public Object[][] ratingToDelete() throws MalformedURLException {

    Rating rating = new Rating();
    rating.setId(URI.create("id://rating-id"));
    rating.setAnnotates(URI.create("id://rating-annotates"));
    rating.setBody(new RatingContent());

    dummyDataStore.store(rating);

    RatingSummaryContent ratingSummaryContent = new RatingSummaryContent();
    ratingSummaryContent.setNumUsersThatRated(1);
    ratingSummaryContent.setInsightNumRatings(2);

    dummyDataStore.store(ratingSummaryContent);

    RatingSummary ratingSummary = new RatingSummary();
    ratingSummary.setAnnotates(rating.getAnnotates());
    ratingSummary.setBody(ratingSummaryContent);

    dummyDataStore.store(ratingSummary);

    rating.getBody().setInsightValue(1);
    rating.getBody().setReliabilityValue(1);
    rating.getBody().setStyleValue(1);
    rating.getBody().setSingleRatingValue(1);

    dummyDataStore.update(rating);

    return new Object[][]{
        {rating.getId()}
    };
  }

  /**
   * Test for ratingService.deleteRating()
   *
   * @param ratingId rating which has to be deleted
   * @throws ApplicationException
   */

  @Test(dataProvider = "ratingToDelete", expectedExceptions = HibernateObjectRetrievalFailureException.class)
  public void testDeleteRatings(URI ratingId) throws ApplicationException{
    ratingsService.deleteRating(ratingId.toString(), DEFAULT_ADMIN_AUTHID);
    Rating rating = ratingsService.getRating(ratingId.toString(), new MockAmbraUser("test"));
  }

  @DataProvider(name = "ratingList")
  public Object[][] ratingList() throws MalformedURLException {

    Article article = new Article();
    article.setId(URI.create("id://article-id"));
    article.seteIssn("testeIssn");
    article.setDublinCore(new DublinCore());
    dummyDataStore.store(article.getDublinCore());
    String annotates =  dummyDataStore.store(article);

    Rating rating = new Rating();
    rating.setId(URI.create("id://rating-id-1"));
    rating.setAnnotates(URI.create(annotates));
    rating.setCreator("testUser");
    dummyDataStore.store(rating);

    Rating rating1 = new Rating();
    rating1.setId(URI.create("id://rating-id1"));
    rating1.setAnnotates(URI.create(annotates));
    rating1.setCreator("testUser1");

    dummyDataStore.store(rating1);

    return new Object[][]{
        {article.getId(), rating.getCreator()},
        {article.getId(), rating1.getCreator()}
    };
  }

  /**
   * Test for ratingService.getRatingList()
   * @param articleUri article for which ratings need to be fetched
   * @param userId userId who created the rating
   */

  @Test(dataProvider = "ratingList")
  public void testGetRatingList(URI articleUri, String userId){
    List<Rating> ratings  = ratingsService.getRatingsList(articleUri.toString(), userId);
    assertNotNull(ratings, "returned null list of annotation");
    assertEquals(ratings.size(), 1, "size should be one");
  }


  @DataProvider(name = "ratingListSummary")
  public Object[][] ratingListSummary() throws MalformedURLException {

    Article article = new Article();
    article.setId(URI.create("id://article-id-1"));
    article.seteIssn("testeIssn");
    article.setDublinCore(new DublinCore());
    dummyDataStore.store(article.getDublinCore());
    String annotates =  dummyDataStore.store(article);

    RatingSummaryContent ratingSummaryContent = new RatingSummaryContent();
    ratingSummaryContent.setNumUsersThatRated(1);
    ratingSummaryContent.setInsightNumRatings(2);

    dummyDataStore.store(ratingSummaryContent);

    Rating rating = new Rating();
    rating.setId(URI.create("id://rating-id-2"));
    rating.setAnnotates(URI.create(annotates));
    rating.setBody(new RatingContent());
    rating.setCreator("testUser");

    dummyDataStore.store(rating);

    RatingSummary ratingSummary = new RatingSummary();
    ratingSummary.setAnnotates(rating.getAnnotates());
    ratingSummary.setBody(ratingSummaryContent);

    dummyDataStore.store(ratingSummary);

    return new Object[][]{
        {article.getId()}
    };
  }

  /**
   * Test for ratingService.getRatingSummaryList()
   * @param articleUri article for which ratings need to be fetched
   */

  @Test(dataProvider = "ratingListSummary")
  public void testGetRatingSummaryList(URI articleUri){
    List<RatingSummary> ratingSummary = ratingsService.getRatingSummaryList(articleUri.toString());
    assertNotNull(ratingSummary, "rating summary is null");
  }

   /**
   * Test for ratingService.hasRated()
   * @param articleUri article for which ratings need to be fetched
   * @param creator userId who created the rating on given article
   */

  @Test(dataProvider = "ratingList")
  public void testHasRated(URI articleUri, String creator){
    boolean hasRated = ratingsService.hasRated(articleUri.toString(), new MockAmbraUser(creator));
    assertTrue(hasRated, "should return true");
  }

   /**
   * Test for ratingService.getRatingsList()
   * @param articleUri article for which ratings need to be fetched
   */

  @Test(dataProvider = "ratingList")
  public void testGetRatingsList(URI articleUri, String creator){
    List<Rating> ratings = ratingsService.getRatingsList(articleUri.toString());
    assertNotNull(ratings, "null list of rating ");
    assertEquals(ratings.size(), 2, "should return 2 objects");
  }

  @DataProvider(name = "rating")
  public Object[][] rating() throws MalformedURLException {

    Rating rating = new Rating();
    rating.setId(URI.create("id://rating-id-3"));
    rating.setAnnotates(URI.create("id://rating-annotates"));
    rating.setCreator("testUser");
    dummyDataStore.store(rating);

    return new Object[][]{
        {rating.getId(), rating.getCreator()},
    };
  }

  /**
   * Test for ratingService.getRating()
   * @param ratingId rating need to be fetched
   * @param creator userId who created rating
   */

  @Test(dataProvider = "rating")
  public void testGetRating(URI ratingId, String creator){
    Rating rating = ratingsService.getRating(ratingId.toString(), new MockAmbraUser(creator));
    assertNotNull(rating, "null list of rating ");
  }

}
