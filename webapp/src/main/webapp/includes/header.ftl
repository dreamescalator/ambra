<!--This is the header file included in main.ftl-->
<!DOCTYPE html>
<html lang="en">
  <head>
    <#include "/includes/global_variables.ftl">
    <title>${pgTitle}</title>

    <#include "/includes/css.ftl">

    <!--chartbeat -->
    <script type="text/javascript">var _sf_startpt=(new Date()).getTime()</script>
    <script>document.documentElement.className += ' js';</script>

    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7; IE=EmulateIE9" />
    <meta name="description" content="${freemarker_config.getMetaDescription(journalContext)}" />
    <meta name="keywords" content="${freemarker_config.getMetaKeywords(journalContext)}" />
    <meta name="almHost" content="${freemarker_config.get("almHost")}" />
    <meta name="solrHost" content="${freemarker_config.get("solrHost")}" />
    <meta name="solrApiKey" content="${freemarker_config.get("solrApiKey")}" />
    <meta name="pubGetHost" content="${freemarker_config.pubGetURL}" />
    <meta name="relativeMetricHost" content="${freemarker_config.get("relativeMetricHost")}" />

    <#include "/includes/article_variables.ftl">

    <link rel="shortcut icon" href="${freemarker_config.context}/images/favicon.ico" type="image/x-icon" />
    <link rel="home" title="home" href="${homeURL}" />
    <link rel="alternate" type="application/rss+xml"
          title="${freemarker_config.getArticleTitlePrefix(journalContext)} New Articles"
          href="${Request[freemarker_config.journalContextAttributeKey].baseUrl}/article/feed" />
  </head>
  <body>
    <#import "global_body.ftl" as global>
    <div id="page-wrap">
      <div id="topbanner" class="cf">
        <div class="center">
          <div class="title">Advertisement</div>
          <img src="/images/placeholder.gif" width="730" height="90" alt="">
        </div>
      </div>

      <div id="pagehdr-wrap">
        <div id="pagehdr">

          <div id="user" class="nav">
            <ul>
              <li><a href="TEST">plos.org</a></li>
              <@s.url id="loginURL" includeParams="none" namespace="/user/secure" action="secureRedirect" goTo="${global.thisPage}"/>
              <li class="btn-style"><a href="${freemarker_config.context}/user/secure/secureRedirect.action?goTo=${global.thisPage}">sign in</a></li>
            </ul>
          </div>
    <#--body and html tags gets closed in global_footer.ftl-->