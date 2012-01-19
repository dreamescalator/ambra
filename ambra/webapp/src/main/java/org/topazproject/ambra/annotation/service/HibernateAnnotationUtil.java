/*
 * $HeadURL$
 * $Id$
 *
 * Copyright (c) 2006-2010 by Public Library of Science
 *     http://plos.org
 *     http://ambraproject.org
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

package org.topazproject.ambra.annotation.service;

import org.springframework.orm.hibernate3.HibernateTemplate;
import org.topazproject.ambra.models.*;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Alex Kudlick Date: 4/18/11
 *         <p/>
 *         org.topazproject.ambra.annotation.service
 */
public class HibernateAnnotationUtil {
  /**
   * Create default citation on formal correction based on article's citation.
   * @param correction Formal correction
   * @param template hibernate template
   * @throws Exception if migration fails
   */
  public static void createDefaultCitation(FormalCorrection correction, Citation articleCitation, HibernateTemplate template) throws Exception {
    Citation citation = createFormalCorrectionCitation(correction.getId().toString(), articleCitation, template);
    template.saveOrUpdate(citation);
    correction.setBibliographicCitation(citation);
  }

  /**
   * Create default citation on retraction based on article's citation.
   * @param retraction Retraction
   * @param template hibernate template
   * @throws Exception if migration fails
   */
  public static void createDefaultCitation(Retraction retraction, Citation articleCitation, HibernateTemplate template) throws Exception {
    Citation citation = createRetractionCitation(retraction.getId().toString(), articleCitation, template);
    template.saveOrUpdate(citation);
    retraction.setBibliographicCitation(citation);
  }

  private static Citation createFormalCorrectionCitation(String annotationId, Citation articleCitation,
        HibernateTemplate template)
      throws Exception {

    Citation citation = new Citation();
    citation.setTitle("Correction: " + articleCitation.getTitle());
    copyCommonProperties(annotationId, articleCitation, citation, template);
    return citation;
  }

  private static Citation createRetractionCitation(String annotationId, Citation articleCitation,
        HibernateTemplate template)
      throws Exception {

    Citation citation = new Citation();
    citation.setTitle("Retraction: " + articleCitation.getTitle());
    copyCommonProperties(annotationId, articleCitation, citation, template);
    return citation;
  }

  private static void copyCommonProperties(String annotationId, Citation articleCitation, Citation citation,
      HibernateTemplate template)
      throws Exception {
    citation.setJournal(articleCitation.getJournal());
    citation.setYear(articleCitation.getYear());
    citation.setDisplayYear("(" + articleCitation.getDisplayYear() + ")");
    citation.setMonth(articleCitation.getMonth());
    citation.setDay(articleCitation.getDay());
    citation.setCitationType(articleCitation.getCitationType());
    citation.setDoi(annotationId.replaceFirst("info:doi/",""));
    citation.setELocationId(null);
    citation.setVolume(null);
    citation.setVolumeNumber(null);
    citation.setIssue(null);
    citation.setUrl(articleCitation.getUrl());
    citation.setSummary(articleCitation.getSummary());
    citation.setPublisherName(articleCitation.getPublisherName());
    citation.setPublisherLocation(articleCitation.getPublisherLocation());
    citation.setPages(articleCitation.getPages());
    citation.setKey(articleCitation.getKey());
    citation.setNote(articleCitation.getNote());

    if (articleCitation.getAuthors() != null) {
      citation.setAuthors(new ArrayList<UserProfile>());
      for (UserProfile userProfile : articleCitation.getAuthors()) {
        UserProfile newProfile = userProfile.clone();
        newProfile.setId(null);
        template.saveOrUpdate(newProfile);
        citation.getAuthors().add(newProfile);
      }
    }

    if (articleCitation.getCollaborativeAuthors() != null && articleCitation.getCollaborativeAuthors().size() > 0) {
      ArrayList<String> collaborativeAuthors = new ArrayList<String>(articleCitation.getCollaborativeAuthors().size());
      for (String collabAuthor : articleCitation.getCollaborativeAuthors()) {
        collaborativeAuthors.add(collabAuthor);
      }
      citation.setCollaborativeAuthors(collaborativeAuthors);
    }

    if (articleCitation.getEditors() != null) {
      citation.setEditors(new ArrayList<UserProfile>());
      for (UserProfile editor : articleCitation.getEditors()) {
        UserProfile newProfile = editor.clone();
        newProfile.setId(null);
        template.saveOrUpdate(newProfile);
        citation.getEditors().add(newProfile);
      }
    }

    Annotation annotation = (Annotation) template.get(Annotation.class, URI.create(annotationId));
    Article article = (Article) template.get(Article.class, annotation.getAnnotates());
    
    // article author information is stored in the article object
    List<ArticleContributor> authors = article.getAuthors();
    if (authors != null) {
      citation.setAnnotationArticleAuthors(new ArrayList<ArticleContributor>());
      for (ArticleContributor author : authors) {
        ArticleContributor newAuthor = new ArticleContributor();
        newAuthor.setGivenNames(author.getGivenNames());
        newAuthor.setSurnames(author.getSurnames());
        newAuthor.setSuffix(author.getSuffix());
        newAuthor.setFullName(author.getFullName());
        newAuthor.setIsAuthor(author.getIsAuthor());

        newAuthor.setId(null);
        template.saveOrUpdate(newAuthor);
        citation.getAnnotationArticleAuthors().add(newAuthor);
      }
    }

    // article editor information is stored in the article object
    List<ArticleContributor> editors = article.getEditors();
    if (editors != null) {
      citation.setAnnotationArticleEditors(new ArrayList<ArticleContributor>());
      for (ArticleContributor editor : editors) {
        ArticleContributor newEditor = new ArticleContributor();
        newEditor.setGivenNames(editor.getGivenNames());
        newEditor.setSurnames(editor.getSurnames());
        newEditor.setSuffix(editor.getSuffix());
        newEditor.setFullName(editor.getFullName());
        newEditor.setIsAuthor(editor.getIsAuthor());

        newEditor.setId(null);
        template.saveOrUpdate(newEditor);
        citation.getAnnotationArticleEditors().add(newEditor);
      }
    }
  }
}
