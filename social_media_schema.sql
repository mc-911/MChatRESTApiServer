--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 16.0

-- Started on 2023-11-17 00:36:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 8 (class 2615 OID 16454)
-- Name: social_media; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA social_media;


ALTER SCHEMA social_media OWNER TO postgres;

--
-- TOC entry 2 (class 3079 OID 16384)
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- TOC entry 4888 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


--
-- TOC entry 3 (class 3079 OID 16406)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4889 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 237 (class 1255 OID 24703)
-- Name: insert_friend_chat(); Type: FUNCTION; Schema: social_media; Owner: postgres
--

CREATE FUNCTION social_media.insert_friend_chat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$DECLARE 
	new_chat_id uuid;
BEGIN
  
  INSERT INTO social_media.chats(chat_id) VALUES (DEFAULT) RETURNING chat_id INTO new_chat_id;
  
	-- Assuming NOW.friend_one and NOW.friend_two are variables or values you want to use
	INSERT INTO social_media.chat_members VALUES (new_chat_id, NEW.friend_one);
	INSERT INTO social_media.chat_members VALUES (new_chat_id, NEW.friend_two);
	return NULL;
END;$$;


ALTER FUNCTION social_media.insert_friend_chat() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 24631)
-- Name: chat_members; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.chat_members (
    chat uuid NOT NULL,
    "user" uuid NOT NULL
);


ALTER TABLE social_media.chat_members OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24625)
-- Name: chats; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.chats (
    chat_id uuid DEFAULT public.uuid_generate_v4() NOT NULL
);


ALTER TABLE social_media.chats OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24669)
-- Name: friends; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.friends (
    friend_one uuid NOT NULL,
    friend_two uuid NOT NULL
);


ALTER TABLE social_media.friends OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24650)
-- Name: messages; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.messages (
    message_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content character varying NOT NULL,
    owner uuid NOT NULL,
    chat uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT LOCALTIMESTAMP NOT NULL
);


ALTER TABLE social_media.messages OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16455)
-- Name: users; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    salt character varying,
    active boolean DEFAULT false
);


ALTER TABLE social_media.users OWNER TO postgres;

--
-- TOC entry 4722 (class 2606 OID 24684)
-- Name: friends CHK_friends_are_different; Type: CHECK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE social_media.friends
    ADD CONSTRAINT "CHK_friends_are_different" CHECK ((friend_one <> friend_two)) NOT VALID;


--
-- TOC entry 4726 (class 2606 OID 24630)
-- Name: chats chat_pkey; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.chats
    ADD CONSTRAINT chat_pkey PRIMARY KEY (chat_id);


--
-- TOC entry 4728 (class 2606 OID 24635)
-- Name: chat_members chat_user_pair; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.chat_members
    ADD CONSTRAINT chat_user_pair PRIMARY KEY (chat, "user");


--
-- TOC entry 4732 (class 2606 OID 24673)
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (friend_one, friend_two);


--
-- TOC entry 4730 (class 2606 OID 24658)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 4724 (class 2606 OID 16461)
-- Name: users user_pkey; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4739 (class 2620 OID 24704)
-- Name: friends create_chat_on_insert; Type: TRIGGER; Schema: social_media; Owner: postgres
--

CREATE TRIGGER create_chat_on_insert AFTER INSERT ON social_media.friends FOR EACH ROW EXECUTE FUNCTION social_media.insert_friend_chat();


--
-- TOC entry 4733 (class 2606 OID 24641)
-- Name: chat_members chat; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.chat_members
    ADD CONSTRAINT chat FOREIGN KEY (chat) REFERENCES social_media.chats(chat_id) NOT VALID;


--
-- TOC entry 4735 (class 2606 OID 24659)
-- Name: messages chat; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.messages
    ADD CONSTRAINT chat FOREIGN KEY (chat) REFERENCES social_media.chats(chat_id);


--
-- TOC entry 4737 (class 2606 OID 24674)
-- Name: friends friend_one; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT friend_one FOREIGN KEY (friend_one) REFERENCES social_media.users(user_id);


--
-- TOC entry 4738 (class 2606 OID 24679)
-- Name: friends friend_two; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT friend_two FOREIGN KEY (friend_two) REFERENCES social_media.users(user_id);


--
-- TOC entry 4736 (class 2606 OID 24664)
-- Name: messages owner; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.messages
    ADD CONSTRAINT owner FOREIGN KEY (owner) REFERENCES social_media.users(user_id);


--
-- TOC entry 4734 (class 2606 OID 24636)
-- Name: chat_members user; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.chat_members
    ADD CONSTRAINT "user" FOREIGN KEY ("user") REFERENCES social_media.users(user_id) NOT VALID;


-- Completed on 2023-11-17 00:36:56

--
-- PostgreSQL database dump complete
--

