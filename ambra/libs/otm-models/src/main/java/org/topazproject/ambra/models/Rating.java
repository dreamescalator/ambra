/* $HeadURL::                                                                            $
 * $Id$
 *
 * Copyright (c) 2007-2008 by Topaz, Inc.
 * http://topazproject.org
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
package org.topazproject.ambra.models;

import org.topazproject.otm.Rdf;
import org.topazproject.otm.annotations.Entity;

/**
 * General base Rating class to store a RatingContent body.
 *
 * @author Stephen Cheng
 */
@Entity(types = {Rating.RDF_TYPE})
public class Rating extends Annotation<RatingContent> {
  private static final long serialVersionUID = -3002676533472572796L;

  public static final String RDF_TYPE = Rdf.topaz + "RatingsAnnotation";
  /** Style */
  public static final String STYLE_TYPE = Rdf.topaz + "StyleRating";
  /** Insight */
  public static final String INSIGHT_TYPE = Rdf.topaz + "InsightRating";
  /** Reliability */
  public static final String RELIABILITY_TYPE = Rdf.topaz + "ReliabilityRating";
  /** Overall */
  public static final String OVERALL_TYPE = Rdf.topaz + "OverallRating";
  /** Single Rating */
  public static final String SINGLE_RATING_TYPE = Rdf.topaz + "SingleRating";

  public String getType() {
    return RDF_TYPE;
  }

  @Override
  public String getWebType() {
    return WEB_TYPE_RATING;
  }
}
