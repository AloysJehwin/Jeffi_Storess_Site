<!DOCTYPE html>
<html lang="en">
<head>
  	<title>Search results</title>
  	<meta charset="UTF-8"> 
    <meta name="description" content="Your description">
    <meta name="keywords" content="Your keywords">
    <meta name="author" content="Your name">
	<!-- demo -->
	<link rel="stylesheet" href="css/reset.css" type="text/css" media="all">
	  <link rel="stylesheet" href="css/fonts.css" type="text/css" media="all">
	  <link rel="stylesheet" href="css/style.css" type="text/css" media="all">
	 <!-- end demo -->
    <script src="../js/jquery-1.7.min.js"></script>
	<script src="search/search.js"></script>
<!--[if lt IE 8]>
   <div style=' clear: both; text-align:center; position: relative;'>
     <a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home?ocid=ie6_countdown_bannercode">
       <img src="http://storage.ie6countdown.com/assets/100/images/banners/warning_bar_0000_us.jpg" border="0" height="42" width="820" alt="You are using an outdated browser. For a faster, safer browsing experience, upgrade for free today." />
    </a>
  </div>
<![endif]-->
<!--[if lt IE 9]>
	<script src="../js/html5.js"></script>
	<link rel="stylesheet" href="../css/ie.css"> 
<![endif]-->
</head>
<body>
	<div id="main">
		<div class="inside">
			<!-- header -->
			<header id="header">
				<div class="inside">
					<h1>Search engine demo</h1>
				</div>
			</header>
			<section id="content">
				<article>
					<a href="Search engine manual.html" class="button">Back to main page</a>
					<form id="search" action="search.php" method="GET"  accept-charset="utf-8">
					   <input type="text" name="s" />
					   <a onclick="document.getElementById('search').submit()">Search</a>
					</form>
					<h3>Search results:</h3>
					<div id="search-results"></div>	
				</article> 
			</section>
		</div>
	</div>
</body>
</html>