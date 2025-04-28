-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: form_builder
-- ------------------------------------------------------
-- Server version	8.0.32

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `form_field_grid_options`
--

DROP TABLE IF EXISTS `form_field_grid_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `form_field_grid_options` (
  `grid_option_id` int NOT NULL AUTO_INCREMENT,
  `field_id` int NOT NULL,
  `row_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`grid_option_id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `form_field_grid_options_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `form_fields` (`field_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_field_grid_options`
--

LOCK TABLES `form_field_grid_options` WRITE;
/*!40000 ALTER TABLE `form_field_grid_options` DISABLE KEYS */;
INSERT INTO `form_field_grid_options` VALUES (17,635,'Row 1','Column 1'),(18,635,'Row 2','Column 2');
/*!40000 ALTER TABLE `form_field_grid_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_field_options`
--

DROP TABLE IF EXISTS `form_field_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `form_field_options` (
  `option_id` int NOT NULL AUTO_INCREMENT,
  `field_id` int NOT NULL,
  `option_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` int DEFAULT '0',
  PRIMARY KEY (`option_id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `form_field_options_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `form_fields` (`field_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_field_options`
--

LOCK TABLES `form_field_options` WRITE;
/*!40000 ALTER TABLE `form_field_options` DISABLE KEYS */;
INSERT INTO `form_field_options` VALUES (88,336,'Option 1',0),(89,336,'Option 2',0),(90,336,'Option 3',0),(91,337,'Option 1',0),(92,337,'Option 2',0),(93,337,'Option 3',0),(101,539,'Work',0),(102,539,'Testing',0),(103,539,'Medical',0),(122,588,'Developing',0),(123,588,'Testing',0);
/*!40000 ALTER TABLE `form_field_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_fields`
--

DROP TABLE IF EXISTS `form_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `form_fields` (
  `field_id` int NOT NULL AUTO_INCREMENT,
  `form_id` int NOT NULL,
  `field_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `position` int DEFAULT NULL,
  `x` int DEFAULT '50',
  `y` int DEFAULT '80',
  `width` int DEFAULT '200',
  `height` int DEFAULT '50',
  `bgColor` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#8B5E5E',
  `labelColor` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#FFFFFF',
  `fontSize` int DEFAULT '16',
  `min_value` int DEFAULT '1',
  `max_value` int DEFAULT '5',
  PRIMARY KEY (`field_id`),
  KEY `form_id` (`form_id`),
  CONSTRAINT `form_fields_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`form_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=692 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_fields`
--

LOCK TABLES `form_fields` WRITE;
/*!40000 ALTER TABLE `form_fields` DISABLE KEYS */;
INSERT INTO `form_fields` VALUES (332,9,'Email','Email',0,NULL,82,216,192,86,'#f2eeee','#0d0d0d',16,1,5),(333,9,'Date','Date',0,NULL,81,131,200,50,'#eee8e8','#0f0f0f',16,1,5),(334,9,'Number','Number',0,NULL,84,306,200,50,'#eee8e8','#000000',16,1,5),(335,9,'Checkbox','Checkbox',0,NULL,87,393,200,50,'#f2f2f2','#0d0d0d',16,1,5),(336,9,'Dropdown','Dropdown',0,NULL,354,137,200,50,'#efebeb','#1a1a1a',16,1,5),(337,9,'Multiple Choice','Multiple Choice',0,NULL,359,242,200,50,'#ebeaea','#0a0a0a',16,1,5),(397,13,'Short Answer','Name',0,NULL,171,149,371,41,'#b3adad','#0d0d0d',16,1,5),(398,13,'Email','Email',0,NULL,175,471,372,68,'#9b9292','#0a0a0a',16,1,5),(399,13,'Date','DOB',0,NULL,171,261,369,50,'#b1aaaa','#050505',16,1,5),(400,13,'Number','Phone Number',0,NULL,174,360,246,59,'#a9a2a2','#0f0f0f',16,1,5),(401,13,'Paragraph','Suggestion',0,NULL,175,577,384,101,'#9b9292','#0d0d0d',16,1,5),(407,16,'Short Answer','Name',0,NULL,50,140,200,50,'#FFFFFF','#000000',16,1,5),(408,16,'Email','Email',0,NULL,50,250,200,50,'#FFFFFF','#000000',16,1,5),(409,16,'Document Type','Document',0,NULL,50,360,567,97,'#FFFFFF','#000000',16,1,5),(512,17,'Short Answer','Name',0,NULL,64,159,568,84,'#FFFFFF','#000000',17,1,5),(513,17,'Email','Email',0,NULL,64,273,568,84,'#FFFFFF','#000000',17,1,5),(514,17,'Number','Number',0,NULL,64,387,568,84,'#FFFFFF','#000000',17,1,5),(515,17,'Short Answer','Address',0,NULL,64,501,568,84,'#FFFFFF','#000000',17,1,5),(516,17,'Short Answer','Emergency Contact Name',0,NULL,64,615,568,84,'#FFFFFF','#000000',17,1,5),(517,17,'Number','Emergency Contact Number',0,NULL,64,729,568,84,'#FFFFFF','#000000',17,1,5),(535,19,'Short Answer','Name',0,NULL,50,160,583,86,'#0f0f0f','#7d7d7d',16,1,5),(536,19,'Email','Email',0,NULL,50,276,583,86,'#0f0f0f','#7d7d7d',16,1,5),(537,19,'Number','Number',0,NULL,50,392,583,86,'#0f0f0f','#7d7d7d',16,1,5),(538,19,'Date','Appointment Date',0,NULL,50,508,583,86,'#0f0f0f','#7d7d7d',16,1,5),(539,19,'Dropdown','Reason for appointment',0,NULL,50,624,583,86,'#0f0f0f','#7d7d7d',16,1,5),(586,20,'Short Answer','Full Name',0,NULL,85,160,565,86,'#80adf4','#000000',16,1,5),(587,20,'Number','Phone Number',0,NULL,85,392,565,86,'#80adf4','#000000',16,1,5),(588,20,'Dropdown','Job Position',0,NULL,85,508,565,86,'#80adf4','#000000',16,1,5),(589,20,'Document Type','Resume',0,NULL,85,617,560,79,'#80adf4','#000000',16,1,5),(590,20,'Email','Email',0,NULL,87,278,562,85,'#7cadf4','#000000',16,1,5),(633,21,'Short Answer','Short Answer',0,NULL,50,160,597,86,'#FFFFFF','#000000',16,1,5),(634,21,'Linear Scale','Linear Scale',0,NULL,50,300,597,84,'#FFFFFF','#000000',16,1,5),(635,21,'Multiple Choice Grid','Multiple Choice Grid',0,NULL,50,440,552,219,'#FFFFFF','#000000',16,1,5),(639,24,'Short Answer','Short Answer',0,NULL,50,160,200,50,'#FFFFFF','#000000',16,1,5),(690,27,'Short Answer','Short Answer',0,NULL,62,134,281,85,'#f7f7f7','#000000',16,1,5),(691,27,'Short Answer','Short Answer',0,NULL,384,130,280,84,'#f7f7f7','#000000',16,1,5);
/*!40000 ALTER TABLE `form_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_responses`
--

DROP TABLE IF EXISTS `form_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `form_responses` (
  `response_id` int NOT NULL AUTO_INCREMENT,
  `form_id` int NOT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`response_id`),
  KEY `form_id` (`form_id`),
  CONSTRAINT `form_responses_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`form_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_responses`
--

LOCK TABLES `form_responses` WRITE;
/*!40000 ALTER TABLE `form_responses` DISABLE KEYS */;
INSERT INTO `form_responses` VALUES (9,16,'2025-03-30 10:36:11'),(10,16,'2025-03-30 10:56:59');
/*!40000 ALTER TABLE `form_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_templates`
--

DROP TABLE IF EXISTS `form_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `form_templates` (
  `template_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `form_background_color` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT 'lightgray',
  `form_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_font_size` int DEFAULT '24',
  `title_x` int DEFAULT '50',
  `title_y` int DEFAULT '20',
  `title_width` int DEFAULT '300',
  `title_height` int DEFAULT '50',
  `title_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#000000',
  `title_background` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `submit_button_x` int DEFAULT '50',
  `submit_button_y` int DEFAULT '400',
  `submit_button_width` int DEFAULT '150',
  `submit_button_height` int DEFAULT '50',
  `submit_button_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `submit_button_background` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#007bff',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `published` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`template_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `form_templates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_templates`
--

LOCK TABLES `form_templates` WRITE;
/*!40000 ALTER TABLE `form_templates` DISABLE KEYS */;
INSERT INTO `form_templates` VALUES (1,1,'lightgray','#ffffff','Contact Information',35,188,59,313,49,'#000000','#ffffff',262,878,150,50,'#ffffff','#28a745','2025-03-31 04:56:30',1),(2,1,'lightgray','#0f0f0f','Appointment Booking',35,188,59,300,50,'#7d7d7d','#0f0f0f',271,771,150,50,'#ffffff','#247036','2025-03-31 13:46:52',1),(3,1,'lightgray','#80adf4','Job Application',35,204,36,300,72,'#000000','#7cadf4',273,753,150,50,'#ffffff','#3061d5','2025-04-01 06:14:27',1);
/*!40000 ALTER TABLE `form_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forms`
--

DROP TABLE IF EXISTS `forms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forms` (
  `form_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `form_background_color` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT 'lightgray',
  `form_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `starred` tinyint(1) DEFAULT '0',
  `is_closed` tinyint(1) DEFAULT '0',
  `internal_note` text COLLATE utf8mb4_unicode_ci,
  `title_font_size` int DEFAULT '24',
  `title_x` int DEFAULT '50',
  `title_y` int DEFAULT '20',
  `title_width` int DEFAULT '300',
  `title_height` int DEFAULT '50',
  `title_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#000000',
  `title_background` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `submit_button_x` int DEFAULT '260',
  `submit_button_y` int DEFAULT '500',
  `submit_button_width` int DEFAULT '150',
  `submit_button_height` int DEFAULT '50',
  `submit_button_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `submit_button_background` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#007bff',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `published` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`form_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `forms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forms`
--

LOCK TABLES `forms` WRITE;
/*!40000 ALTER TABLE `forms` DISABLE KEYS */;
INSERT INTO `forms` VALUES (9,1,'lightgray','#f4ecec','Forms Testing',0,0,NULL,24,236,37,179,60,'#000000','#f1e9e9',256,512,150,50,'#ffffff','#0cb04b','2025-03-18 10:59:02',1),(13,1,'lightgray','#f5f5f5','Personal details',0,0,NULL,24,212,51,300,50,'#000000','#ffffff',287,696,150,50,'#ffffff','#28a745','2025-03-24 04:57:49',1),(16,1,'lightgray','gray','Testing Document',0,0,NULL,24,50,20,300,50,'#000000','#ffffff',260,500,150,50,'#ffffff','#28a745','2025-03-30 07:06:02',1),(17,1,'lightgray','#ffffff','Contact Information',0,0,NULL,35,188,59,313,49,'#000000','#ffffff',262,878,150,50,'#ffffff','#28a745','2025-03-31 04:56:30',1),(19,1,'lightgray','#0f0f0f','Appointment Booking',1,0,NULL,35,188,59,300,50,'#7d7d7d','#0f0f0f',271,771,150,50,'#ffffff','#247036','2025-03-31 13:46:52',1),(20,1,'lightgray','#80adf4','  Job Application',0,0,NULL,35,204,36,300,72,'#000000','#7cadf4',273,753,150,50,'#ffffff','#3061d5','2025-04-01 06:14:27',1),(21,1,'lightgray','gray','Testing new field',0,0,NULL,35,165,30,364,69,'#000000','#ffffff',271,689,150,50,'#ffffff','#28a745','2025-04-01 09:31:41',0),(24,1,'lightgray','gray','Untitled Form',0,0,NULL,24,50,20,300,50,'#000000','#ffffff',260,500,150,50,'#ffffff','#28a745','2025-04-04 11:48:56',0),(27,1,'#d6d6d6','#f7f7f7','Untitled Form (Copy)',1,0,'hii',24,200,28,300,50,'#000000','#f7f7f7',260,500,150,50,'#ffffff','#28a745','2025-04-07 07:27:11',1);
/*!40000 ALTER TABLE `forms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otpstorage`
--

DROP TABLE IF EXISTS `otpstorage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otpstorage` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `UserInput` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `OTP` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ExpiryTime` datetime NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `UserInput_UNIQUE` (`UserInput`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otpstorage`
--

LOCK TABLES `otpstorage` WRITE;
/*!40000 ALTER TABLE `otpstorage` DISABLE KEYS */;
INSERT INTO `otpstorage` VALUES (1,'ben@gmail.com','517694','2025-04-02 23:02:21');
/*!40000 ALTER TABLE `otpstorage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `response_fields`
--

DROP TABLE IF EXISTS `response_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `response_fields` (
  `response_field_id` int NOT NULL AUTO_INCREMENT,
  `response_id` int NOT NULL,
  `field_id` int NOT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`response_field_id`),
  KEY `response_id` (`response_id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `response_fields_ibfk_1` FOREIGN KEY (`response_id`) REFERENCES `form_responses` (`response_id`) ON DELETE CASCADE,
  CONSTRAINT `response_fields_ibfk_2` FOREIGN KEY (`field_id`) REFERENCES `form_fields` (`field_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `response_fields`
--

LOCK TABLES `response_fields` WRITE;
/*!40000 ALTER TABLE `response_fields` DISABLE KEYS */;
INSERT INTO `response_fields` VALUES (25,9,407,'test'),(26,9,408,'test'),(27,9,409,'/uploads/1743330971900-Responses_9.pdf'),(28,10,407,'test2'),(29,10,408,'test2'),(30,10,409,'/uploads/1743332219397-Responses_9.xlsx');
/*!40000 ALTER TABLE `response_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `template_field_grid_options`
--

DROP TABLE IF EXISTS `template_field_grid_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `template_field_grid_options` (
  `grid_option_id` int NOT NULL AUTO_INCREMENT,
  `template_field_id` int NOT NULL,
  `row_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`grid_option_id`),
  KEY `template_field_id` (`template_field_id`),
  CONSTRAINT `template_field_grid_options_ibfk_1` FOREIGN KEY (`template_field_id`) REFERENCES `template_fields` (`template_field_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `template_field_grid_options`
--

LOCK TABLES `template_field_grid_options` WRITE;
/*!40000 ALTER TABLE `template_field_grid_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `template_field_grid_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `template_field_options`
--

DROP TABLE IF EXISTS `template_field_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `template_field_options` (
  `option_id` int NOT NULL AUTO_INCREMENT,
  `template_field_id` int NOT NULL,
  `option_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` int DEFAULT '0',
  PRIMARY KEY (`option_id`),
  KEY `template_field_id` (`template_field_id`),
  CONSTRAINT `template_field_options_ibfk_1` FOREIGN KEY (`template_field_id`) REFERENCES `template_fields` (`template_field_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `template_field_options`
--

LOCK TABLES `template_field_options` WRITE;
/*!40000 ALTER TABLE `template_field_options` DISABLE KEYS */;
INSERT INTO `template_field_options` VALUES (1,11,'Consultation',0),(2,11,'Consultation',0),(3,11,'Other',0),(4,14,'Developing',0),(5,14,'Testing',0);
/*!40000 ALTER TABLE `template_field_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `template_fields`
--

DROP TABLE IF EXISTS `template_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `template_fields` (
  `template_field_id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `field_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `position` int DEFAULT NULL,
  `x` int DEFAULT '50',
  `y` int DEFAULT '80',
  `width` int DEFAULT '200',
  `height` int DEFAULT '50',
  `bgColor` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#8B5E5E',
  `labelColor` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#FFFFFF',
  `fontSize` int DEFAULT '16',
  `min_value` int DEFAULT '1',
  `max_value` int DEFAULT '5',
  PRIMARY KEY (`template_field_id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `template_fields_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `form_templates` (`template_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `template_fields`
--

LOCK TABLES `template_fields` WRITE;
/*!40000 ALTER TABLE `template_fields` DISABLE KEYS */;
INSERT INTO `template_fields` VALUES (1,1,'Short Answer','Name',0,NULL,64,159,568,84,'#FFFFFF','#000000',17,1,5),(2,1,'Email','Email',0,NULL,64,273,568,84,'#FFFFFF','#000000',17,1,5),(3,1,'Number','Number',0,NULL,64,387,568,84,'#FFFFFF','#000000',17,1,5),(4,1,'Short Answer','Address',0,NULL,64,501,568,84,'#FFFFFF','#000000',17,1,5),(5,1,'Short Answer','Emergency Contact Name',0,NULL,64,615,568,84,'#FFFFFF','#000000',17,1,5),(6,1,'Number','Emergency Contact Number',0,NULL,64,729,568,84,'#FFFFFF','#000000',17,1,5),(7,2,'Short Answer','Name',0,NULL,50,160,583,86,'#0f0f0f','#7d7d7d',16,1,5),(8,2,'Email','Email',0,NULL,50,276,583,86,'#0f0f0f','#7d7d7d',16,1,5),(9,2,'Number','Number',0,NULL,50,392,583,86,'#0f0f0f','#7d7d7d',16,1,5),(10,2,'Date','Appointment Date',0,NULL,50,508,583,86,'#0f0f0f','#7d7d7d',16,1,5),(11,2,'Dropdown','Reason for appointment',0,NULL,50,624,583,86,'#0f0f0f','#7d7d7d',16,1,5),(12,3,'Short Answer','Full Name',0,NULL,85,160,565,86,'#80adf4','#000000',16,1,5),(13,3,'Number','Phone Number',0,NULL,85,392,565,86,'#80adf4','#000000',16,1,5),(14,3,'Dropdown','Job Position',0,NULL,85,508,565,86,'#80adf4','#000000',16,1,5),(15,3,'Document Type','Resume',0,NULL,85,617,560,79,'#80adf4','#000000',16,1,5),(16,3,'Email','Email',0,NULL,87,278,562,85,'#7cadf4','#000000',16,1,5);
/*!40000 ALTER TABLE `template_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_password` text COLLATE utf8mb4_unicode_ci,
  `created_time` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ben tenison','ben@gmail.com','$2a$12$Sn7SzleVL/miGRcC1ETg0edBMQgE6AfAXVJF3CyTQlF0N8WUXIcKO','2025-03-11 12:39:34'),(2,'kevin','kevin@gmail.com','$2b$10$KsobIW4oXYJ23V6TlF7opelDFsUO7TCVO8Kx3QFKNcFOekmqagvWe','2025-03-12 01:39:12'),(5,'Pavithran VV','vv.pavithran12@gmail.com','','2025-04-02 23:32:04');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-28 10:22:55
