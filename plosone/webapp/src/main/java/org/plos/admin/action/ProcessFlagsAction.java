/* $$HeadURL::                                                                            $$
 * $$Id$$
 *
 * Copyright (c) 2006 by Topaz, Inc.
 * http://topazproject.org
 *
 * Licensed under the Educational Community License version 1.0
 * http://opensource.org/licenses/ecl1.php
 */

package org.plos.admin.action;

import java.rmi.RemoteException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.plos.ApplicationException;
import org.plos.annotation.service.AnnotationService;
import org.plos.annotation.service.Flag;
import org.plos.annotation.service.ReplyWebService;
import org.plos.annotation.service.ReplyInfo;

public class ProcessFlagsAction extends BaseAdminActionSupport {
  
  private static final Log log = LogFactory.getLog(ProcessFlagsAction.class);
  private String[] commentsToUnflag;
  private String[] commentsToDelete;
  private AnnotationService annotationService;	
  private ReplyWebService replyWebService;
  
  
  public void setAnnotationService(AnnotationService annotationService) {
    this.annotationService = annotationService;
  }
  
  public void setCommentsToUnflag(String[] comments) {
    commentsToUnflag = comments;
  }
  
  public void setCommentsToDelete(String[] comments) {
    commentsToDelete = comments;
  }
  
  public String execute() throws RemoteException, ApplicationException {
    String[] segments;
    
    if (commentsToUnflag != null){
      for (String toUnFlag : commentsToUnflag){
        if (log.isDebugEnabled()){
          log.debug("Found comment to unflag: " + toUnFlag);
        }
        segments = toUnFlag.split("_");
        deleteFlag(segments[0], segments[1]);
      }
    }
    
    if (commentsToDelete != null) {
      for (String toDelete : commentsToDelete) {
        if (log.isDebugEnabled()) {
          log.debug("Found comment to delete: " + toDelete);
        }
        segments = toDelete.split("_");
        deleteTarget(segments[0], segments[1]);
      }
    }
    return base();
  }
  
  /**
   * @param root
   * @param target
   * 
   * Delete the target. Root is either an id (in which case 
   * target is a reply) or else it is a "" in which case target is an annotation. 
   * In either case:
   * 		remove flags on this target
   * 		get all replies to this target
   * 			for each reply
   * 				check to see if reply has flags
   * 					remove each flag
   * 		remove all replies in bulk
   * 		remove target
   * 		
   * 	Note that because this may be called from a 'batch' job (i.e multiple
   *  rows were checked off in process flags UI) it may be that things have
   *  been deleted by previous actions. So we catch 'non-exsietent-id' exceptions
   *  which may well get thrown and recover and continue (faster than going across
   *  teh web service tro see if the ID is valid then going out again to get its object).		
   * @throws ApplicationException 
   * @throws ApplicationException 
   * @throws NoSuchAnnotationIdException 
   * @throws RemoteException 
   * @throws NoSuchAnnotationIdException 
   * @throws RemoteException 
   */
  private void deleteTarget(String root, String target) throws ApplicationException, RemoteException {
    ReplyInfo[] replies;		
    Flag[] flags = annotationService.listFlags(target);
    boolean isReply = root.length() > 0;
    
    if (log.isDebugEnabled()) {
      log.debug("Deleting Target" + target + " Root is " + root);
      log.debug(target + " has " + flags.length + " flags - deleting them");
    }
    for (Flag flag: flags) {
      try {
        deleteFlag(target, flag.getId());
      } catch (Exception e) {
        //keep going through the list even if there is an exception
        if (log.isWarnEnabled()) {
          log.warn("Couldn't delete flag: " + flag.getId(), e);
        }
      }
    }
    
    if (isReply) { // it's a reply
      replies = annotationService.listAllRepliesFlattened(root, target);
    } else {
      replies = annotationService.listAllRepliesFlattened(target, target);
    }
    
    if (log.isDebugEnabled()) {
      log.debug(target + " has " + replies.length + " replies. Removing their flags");
    }
    for (ReplyInfo reply : replies) {
      flags = annotationService.listFlags(reply.getId());
      if (log.isDebugEnabled()) {
        log.debug("Reply " + reply.getId() + " has " + flags.length + " flags");
      }
      for (Flag flag: flags) {
        if (flag.isDeleted())
          continue;
        deleteFlag(reply.getId(), flag.getId());
      }				
    }
    
    if (isReply) {
      replyWebService.deleteReplies(target); // Bulk delete
      //annotationService.deleteReply(target);
      if (log.isDebugEnabled()) {
        log.debug("Deleted reply: " + target);
      }
    } else {
      replyWebService.deleteReplies(target, target);
      annotationService.deletePublicAnnotation(target);
      if (log.isDebugEnabled()) {
        log.debug("Deleted annotation: " + target);
      }
    }
  }
  
  private void deleteFlag(String target, String flag) throws ApplicationException {
    // Delete flag
    annotationService.deleteFlag(flag);
    // Deal with 'flagged' status
    Flag[] flags = annotationService.listFlags(target);
    if (log.isDebugEnabled()) {
      log.debug("Deleting flag: " + flag + " on target: " + target);
      log.debug("Checking for flags on target: " + target + ". There are " + flags.length + " flags remaining");
    }
    if (0 == flags.length) {
      if (log.isDebugEnabled()) {
        log.debug("Setting status to unflagged");
      }
      if (isAnnotation(target)) {
        annotationService.unflagAnnotation(target);
      } else if (isReply(target)) {
        annotationService.unflagReply(target);
      } else {
        String msg = target + " cannot be unFlagged - not annotation or reply";
        log.error(msg);
        throw new ApplicationException(msg);
      }
    } else {
      log.debug("Flags exist. Target will remain marked as flagged");
    }
  }
  
  private boolean isReply(String target) {
    String segments[] = target.split("/");
    if (segments.length >= 2)
      if (segments[segments.length - 2].equalsIgnoreCase("reply"))
        return true;
    return false;
  }
  
  private boolean isAnnotation(String target) {
    String segments[] = target.split("/");
    if (segments.length >= 2)
      if (segments[segments.length - 2].equalsIgnoreCase("annotation"))
        return true;
    return false;
  }
  
  public void setReplyWebService(ReplyWebService replyWebService) {
    this.replyWebService = replyWebService;
  }
  
}