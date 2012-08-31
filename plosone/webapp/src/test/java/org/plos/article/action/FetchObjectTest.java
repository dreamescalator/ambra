/* $HeadURL::                                                                            $
 * $Id$
 *
 * Copyright (c) 2006 by Topaz, Inc.
 * http://topazproject.org
 *
 * Licensed under the Educational Community License version 1.0
 * http://opensource.org/licenses/ecl1.php
 */
package org.plos.article.action;

import com.opensymphony.xwork.Action;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.plos.BasePlosoneTestCase;
import org.plos.article.service.ArticleOtmService;
import org.plos.article.service.SecondaryObject;
import org.plos.article.util.NoSuchArticleIdException;
import org.plos.models.ObjectInfo;

import java.net.URL;
import java.util.Set;

public class FetchObjectTest extends BasePlosoneTestCase {
  private static final Log log = LogFactory.getLog(FetchObjectTest.class);
  private String BASE_TEST_PATH = "src/test/resources/";

  public void testArticleRepresentations() throws Exception {
    final ArticleOtmService service = getArticleOtmService();

    final String resourceToIngest = BASE_TEST_PATH  + "pone.0000008.zip";
    final String uri = "info:doi/10.1371/journal.pone.0000008";

    deleteAndIngestArticle(resourceToIngest, uri);

    final ObjectInfo oi = service.getObjectInfo(uri);
    final Set<String> ri = oi.getRepresentations();
    assertEquals(2, ri.size());

    final FetchObjectAction fetchObjectAction = getFetchObjectAction();
    fetchObjectAction.setUri(uri);
    fetchObjectAction.setRepresentation("XML");
    assertEquals(Action.SUCCESS, fetchObjectAction.execute());

    final SecondaryObject[] so = service.listSecondaryObjects(uri);
    assertEquals(8, so.length);

    final Set<String> riForG001 = service.getObjectInfo(uri + ".g001").getRepresentations();
    assertEquals(1, riForG001.size());
  }

  public void testSecondaryDocInfo() throws Exception {
    final String resourceToIngest = BASE_TEST_PATH  + "pone.0000008.zip";
    final String uri = "info:doi/10.1371/journal.pone.0000008";

    deleteAndIngestArticle(resourceToIngest, uri);

    final SecondaryObjectAction secondaryObjectAction = getSecondaryObjectAction();
    secondaryObjectAction.setUri(uri);
    assertEquals(Action.SUCCESS, secondaryObjectAction.execute());

    final SecondaryObject[] oi = secondaryObjectAction.getSecondaryObjects();
    assertEquals(8, oi.length);

    for (final SecondaryObject objectInfo : oi) {
      assertNotNull(objectInfo.getUri());
    }
  }

  private void deleteAndIngestArticle(final String resourceToIngest, final String uri) throws Exception {
    final URL article = getAsUrl(resourceToIngest);
    final ArticleOtmService service = getArticleOtmService();

    try {
      service.delete(uri);
    } catch(NoSuchArticleIdException ex) {
      //means that this article is not ingested yet, so delete would fail
    }

    final String ingestedUri = service.ingest(article);
    assertEquals(uri, ingestedUri);
  }
}