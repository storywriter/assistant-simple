// Watson Assistant の IBM公式サンプルコードの骨子のみを、jQuery で簡略化した


;( function( $ ) {


  var watsonAssistantApi = window.watsonAssistantApi = {

    // Watson Assistant では、context や変数をアプリケーション側で保持しておく必要がある
    stored :{
      requestPayload : {},
      responsePayload : {}
    },

    messageEndpoint : '/api/message',

    sendRequest : function( text, context ) {
      // Watson にクエリを送信し、レスポンスを受け取り、別のイベントへ受け渡す

      var _this = this;
      var payloadToWatson = {};
      var param, e;

      if ( text ) {
        payloadToWatson.input = {
          text: text
        };
      }
      if ( context ) {
        payloadToWatson.context = context;
      }

      param = JSON.stringify( payloadToWatson );

      // ユーザーの入力を保存する
      _this.setRequestPayload( param );

      // 送信時のカスタムイベントを発火する
      e = $.Event( 'watsonAssistant.request', {
        typeValue : 'user',
        payload: _this.getRequestPayload()
      } );
      $( window ).trigger( e );

      // Watson に Ajax でクエリを送信する
      $.ajax( {

        type : 'POST',
        contentType : 'application/json',
        url : _this.messageEndpoint,
        data : param

      } )

      .then( function( data ) {
        // Ajax が成功したら

        // Watson の応答を保存する
        _this.setResponsePayload( data );

        // 受信時のカスタムイベントを発火する
        e = $.Event( 'watsonAssistant.response', {
          typeValue : 'watson',
          payload: _this.getResponsePayload()
        } );
        $( window ).trigger( e );

      } )

      .catch( function( jqXHR, textStatus, errorThrown ) {
        // エラーが発生したら

        console.log( errorThrown );

      } );

    },

    getRequestPayload : function() {
      // ユーザーからの前回の入力を返す

      var _this = this;
      return _this.stored.requestPayload;

    },

    setRequestPayload : function( newPayloadStr ) {
      // ユーザーからの入力を保存する

      var _this = this;

      if ( $.type( newPayloadStr ) === 'string' ) { // JSONオブジェクトじゃなかったら
        newPayloadStr = JSON.parse( newPayloadStr );
      }

      _this.stored.requestPayload = newPayloadStr;

    },

    getResponsePayload : function() {
      // Watson からの前回の応答を返す

      var _this = this;
      return _this.stored.responsePayload;

    },

    setResponsePayload : function( newPayloadStr ) {
      // Watson からの応答を保存する

      var _this = this;

      if ( $.type( newPayloadStr ) === 'string' ) { // JSONオブジェクトじゃなかったら
        newPayloadStr = JSON.parse( newPayloadStr );
      }

      _this.stored.responsePayload = newPayloadStr;

    },

    displayMessage : function( newPayload, typeValue ) {
      // 送信したユーザーの入力 または 受信した Watson のメッセージを表示する

      var _this = this;

      var isUser = ( typeValue === 'user' ) ? true : false;
      var chatBox = $( '#scrollingChat' );
      var template = $( $( 'script[type*=templateChat]' ).eq( 0 ).html() ); // HTML中に script要素を利用して、テンプレートを書き込んでおく
      var text, message;

      if ( isUser ) {
        text = ( newPayload.input && newPayload.input.text );
      } else {
        text = ( newPayload.output && newPayload.output.text );
      }

      if ( text ) {

        // メッセージのDOM要素を作成する
        if( isUser ){
          template.find( '.message-outer' ).addClass( 'from-user' );
          $( '.from-user.latest' ).removeClass( 'latest' ); // 古いセレクタを削除
        } else {
          template.find( '.message-outer' ).addClass( 'from-watson' );
          $( '.from-watson.latest' ).removeClass( 'latest' ); // 古いセレクタを削除
        }
        template.find( '.message-text' ).html( text );
        message = template;

        // メッセージのDOM要素を追加する
        chatBox.append( message );

        // 追加されたメッセージにスクロールする
        _this.scrollToChatBottom();
      }

    },

    scrollToChatBottom : function() {
      // 最新のメッセージまでスクロールする

      var scrollEl = $( '#scrollingChat' ).find( '.from-user.latest' );
      if ( scrollEl ) {
        $( 'body, html' ).animate( { scrollTop : scrollEl.offset().top }, 500 );
      }

    },

    init : function() {
      // 初期化

      var _this = this;

      // チャット入力欄でエンターキーを押下
      $( '#js-chat-input-text' ).keydown( function( event ) {

        var inputBox = $( '#js-chat-input-text' );

        // エンターキーが押されて、かつ、チャット入力欄が空でない
        if ( event.keyCode === 13 && inputBox.val() ) {

          // 送信ボタンをクリック
          $( '#js-chat-input-submit' ).trigger( 'click' );

        }

      } );


      // 送信ボタンを押下
      $( '#js-chat-input-submit' ).click( function( event ) {

        var inputBox = $( '#js-chat-input-text' );

        // チャット入力欄が空でない
        if ( inputBox.val() ) {

          // サーバーサイドから前回のレスポンスにある、context の値を継承する。
          // context には、conversation_id が含まれていて、Dialog のステート（状態）を示している。
          var context;
          var latestResponse = _this.getResponsePayload();

          if ( latestResponse ) {
            context = latestResponse.context;
          }

          // メッセージを送信する
          _this.sendRequest( inputBox.val(), context );

          // 次回の入力にそなえてチャット入力欄を空にする
          inputBox.val( '' );

        }

      } );


      // ユーザーがリクエストを送信したとき
      $( window ).on( 'watsonAssistant.request', function( event ) {

        // eventオブジェクトの内容
        // event.payload : ユーザーの入力値と context を含めたオブジェクト
        // event.typeValue : 'user'という文字列

        // このイベントにバインドして送信時の処理や分岐を書く。
        // 例えば、質問ログをアクセス解析ツールへ渡す、など。

        _this.displayMessage( event.payload, event.typeValue );

      } );


      // Watson からレスポンスを受信したとき
      $( window ).on( 'watsonAssistant.response', function( event ) {

        // eventオブジェクトの内容
        // event.payload : Watson が応答したオブジェクト
        // event.typeValue : 'watson'という文字列

        // このイベントにバインドして受信時の処理や分岐を書く。
        // 例えば、Assistant の output オブジェクトに "action" : "NLC" という値を含めておき、
        // Natural Language Classifier へ問い合わせして、その結果を displayMessage() に渡す、など。
        // Assistant は、処理を Assistant 内だけで完結させず、ほかのAPIと組み合わせると、柔軟性が広がる。
        // また、応答ログをアクセス解析ツールへ渡すなども、ここで行う。

        _this.displayMessage( event.payload, event.typeValue );

      } );


    }

  };


  // 初期化
  watsonAssistantApi.init();

  // 最初のリクエストを送る。
  // Assistant では、最初の語りかけはアプリケーションの側から行う必要がある。
  // すると Assistant の Dialog ツリーの、welcome ノードまたは conversation_start ノードが返る。
  watsonAssistantApi.sendRequest( '', '' );


} )( jQuery );
